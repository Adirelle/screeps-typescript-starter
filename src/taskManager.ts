
declare global {
  interface Creep {
    working?: string;
  }
}

type EnergizedStructure = Structure & EnergyContainer;

class Manager {
  private room: Room;
  private creeps: Creep[];
  private creepsLeft: number;
  private task: string;

  private tasks: Array<() => void> = [
    this.urgentUpgrade,
    this.pickup,
    this.harvest,
    this.withdraw,
    this.build,
    this.refill,
    this.upgrade
  ];

  private structureRefillPriority: { [type: string]: number } = {
    [STRUCTURE_TOWER]: 40,
    [STRUCTURE_SPAWN]: 30,
    [STRUCTURE_EXTENSION]: 20,
    [STRUCTURE_LINK]: 10
  };

  // Main method

  public manage(room: Room) {
    this.room = room;
    this.creeps = Array.from(room.myCreeps);
    if (!this.creeps.length) {
      return;
    }
    _.sortBy(this.creeps, 'name');
    this.creepsLeft = this.creeps.length;
    _.each(this.creeps, (c) => delete c.working);

    this.task = '-';
    this.debug('start');
    for (let i = 0; i < this.tasks.length && this.creepsLeft > 0 && Game.cpu.getUsed() < Game.cpu.limit; i++) {
      const task = this.tasks[i];
      this.task = task.name;
      task.call(this);
      _.remove(this.creeps, 'working');
      this.debug('done');
    }
    this.task = '-';
    this.debug('end');

    _.each(room.myCreeps, (c) => c.memory.task = c.working);
  }

  // Helpers

  private doTask<T extends { pos: RoomPosition }>(
    targets: T[],
    action: ((creep: Creep, target: T) => ResultCode),
    selector: ((c: Creep, target: T) => boolean) = _.constant(true),
    important: boolean = false
  ) {
    if (!targets.length) {
      this.debug('no target');
      return;
    }
    const availableCreeps = _.filter(this.creeps, (c) => !c.working);
    this.debug(`${targets.length} targets, ${availableCreeps.length} available creeps`);
    if (!availableCreeps.length) {
      return;
    }

    if (important || availableCreeps.length >= targets.length) {
      for (const target of targets) {
        const creep = target.pos.findClosestByPath<Creep>(availableCreeps, {filter: (c: Creep) => !c.working && selector(c, target)});
        if (creep) {
          this.perform(creep, target, action(creep, target));
        }
      }
    } else {
      const n = availableCreeps.length;
      for (let i = 0; i < n; i++) {
        const creep = availableCreeps[i];
        const target = creep.pos.findClosestByPath<T>(targets, {filter: (t: T) => selector(creep, t)});
        if (target) {
          this.perform(creep, target, action(creep, target));
        }
      }
    }
  }

  private perform(creep: Creep, target: { pos: RoomPosition }, result: ResultCode): boolean {
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(target.pos, {visualizePathStyle: {stroke: creep.color, strokeWidth: 0.1, lineStyle: 'dotted', opacity: 0.7}});
      if (result !== OK && result !== ERR_TIRED) {
        this.debug(`${creep} cannot move to ${this.task} ${target}: ${result}`);
        return false;
      }
      this.debug(`${creep} is going to ${this.task} ${target}`);
    } else if (result !== OK) {
      this.debug(`${creep} cannot ${this.task} ${target}: ${result}`);
      return false;
    } else {
      this.debug(`${creep} is ${this.task}ing ${target}`);
    }
    creep.working = this.task;
    this.creepsLeft--;
    return true;
  }

  // Logging

  private debug(...args: any[]) {
    log.debug(`[${this.room.name}, ${this.task}, ${Game.cpu.getUsed()}, ${this.creepsLeft}]:`, ...args);
  }

  // Tasks

  private urgentUpgrade() {
    const ctrl = this.room.controller;
    if (!ctrl || !ctrl.my || ctrl.ticksToDowngrade > 5000) {
      return;
    }
    this.doTask<Controller>(
      [ctrl],
      (c, t) => c.upgradeController(t),
      (c) => c.energy > 0 && (c.energy === c.energyCapacity || c.memory.task === 'urgentUpgrade'),
      true
    );
  }

  private pickup() {
    this.doTask(
      this.room.find<Resource>(FIND_DROPPED_RESOURCES, {filter: (r: Resource) => r.resourceType === RESOURCE_ENERGY}),
      (c, t) => c.pickup(t),
      (c) => c.energy < c.energyCapacity && (c.energy === 0 || c.memory.task === 'pickup'),
      true
    );
  }

  private harvest() {
    const spots = _.filter(findHarvestSpots(this.room), (s) => s.source.energy > 0);
    spots.sort((a, b) => b.source.energy - a.source.energy);
    this.doTask(
      spots,
      (c, t) => c.harvest(t.source),
      (c) => c.energy < c.energyCapacity && (c.energy === 0 || c.memory.task === 'harvest'),
      true
    );
  }

  private withdraw() {
    this.doTask(
      _.filter(
          this.room.myActiveStructures as EnergizedStructure[],
          (s) => s.structureType === STRUCTURE_LINK && s.energy > 0
      ),
      (c, t) => c.withdraw(t, RESOURCE_ENERGY),
      (c) => c.energy === 0
    );
  }

  private refill() {
    const structs = _.filter(this.room.myActiveStructures as EnergizedStructure[], (s) => s.energy < s.energyCapacity);
    const prios = this.structureRefillPriority;
    structs.sort((a, b) => (prios[b.structureType] || 0) - (prios[a.structureType] || 0));
    this.doTask<EnergizedStructure>(
      structs,
      (c, t) => c.transfer(t, RESOURCE_ENERGY),
      (c, t) => c.energy > 0 && (t.structureType !== STRUCTURE_LINK || c.memory.task !== 'withdraw')
    );
  }

  private build() {
    this.doTask(
      this.room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES),
      (c, t) => c.build(t),
      (c) => c.energy > 0 && (c.energy === c.energyCapacity || c.memory.task === 'build')
    );
  }

  private upgrade() {
    const ctrl = this.room.controller;
    if (!ctrl || !ctrl.my) {
      return;
    }
    const targets = [];
    for (let i = 0; i < ctrl.level; i++) {
      targets.push(ctrl);
    }
    this.doTask(
      targets,
      (c, t) => c.upgradeController(t),
      (c) => c.energy > 0 && (c.energy === c.energyCapacity || c.memory.task === 'upgrade')
    );
  }
}

const manager = new Manager();

export function manageTasks(room: Room) {
  manager.manage(room);
}

interface HarvestSpot {
  source: Source;
  pos: RoomPosition;
}

const findHarvestSpots: ((room: Room) => HarvestSpot[]) = _.memoize(
  (room: Room) => {
    const spots: HarvestSpot[] = [];
    _.each(
      room.find<Source>(FIND_SOURCES_ACTIVE),
      (source) => {
        _.each(
          room.lookForAtArea(
            LOOK_TERRAIN,
            source.pos.y - 1,
            source.pos.x - 1,
            source.pos.y + 1,
            source.pos.x + 1,
            true
          ),
          ({ x, y, terrain }: LookAtResultWithPos) => {
            if (terrain === 'swamp' || terrain === 'plain') {
              spots.push({source, pos: new RoomPosition(x, y, room.name)});
            }
          }
        );
      });
    return spots;
  },
  _.property('name')
);
