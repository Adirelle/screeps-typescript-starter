import { BaseRole, CreepFactory, CreepPopulation, CreepRole } from './role';

export const factory: CreepFactory = new class {
  public name = 'mule';
  public bodyTemplate = [MOVE, CARRY];
  public dependsOn = { harvester: 2 };

  public create(creep: Creep): CreepRole {
    return new Mule(creep);
  }

  public targetPopulation(_room: Room, pop: CreepPopulation): number {
    return Math.max(1, pop.harvester * 2);
  }
}();

interface EnergizedStructure extends Structure {
  energy: number;
  energyCapacity: number;
}

type MuleTarget = Creep | EnergizedStructure;

export class Mule extends BaseRole {
  public run(): void {
    const creep = this.creep;
    const mem = creep.memory;
    const blacklist: MuleTarget[] = [];
    let target: MuleTarget | null =
      mem.target && Game.getObjectById<MuleTarget>(mem.target);
    let task: string | null = target && mem.task;
    let maxIter = 10;

    do {
      if (target !== null && task !== null) {
        let result = -999;
        if (task === 'withdraw' && target instanceof Creep) {
          if (
            (target.carry.energy || 0) > 0 ||
            (creep.carry.energy || 0) < creep.carryCapacity
          ) {
            result = target.transfer(creep, RESOURCE_ENERGY);
          }
        } else {
          if ((creep.carry.energy || 0) > 0) {
            result = creep.transfer(target, RESOURCE_ENERGY);
          }
        }
        if (result === ERR_NOT_IN_RANGE) {
          result = creep.moveTo(target);
        }
        if (result !== OK && result !== ERR_TIRED) {
          blacklist.push(target);
          task = target = null;
        } else {
          break;
        }
      }

      if (creep.carry.energy === 0) {
        target = findHarvesterToEmpty(creep, blacklist);
        if (target) {
          task = 'withdraw';
        }
      } else {
        target = findTargetToRefill(creep);
        if (target) {
          task = 'transfer';
        }
      }
    } while (target && task && --maxIter);

    if (task !== mem.task || (target && target.id) !== mem.target) {
      if (target && task) {
        creep.say(task + 'ing');
        mem.target = target.id;
        mem.task = task;
      } else {
        mem.target = mem.task = undefined;
      }
    }
  }
}

function findHarvesterToEmpty(creep: Creep, blacklist: MuleTarget[]): Creep | null {
  const allH = creep.room.find<Creep>(FIND_MY_CREEPS, {
    filter: (c: Creep) => c.memory.role === 'harverster'
  });
  const harvesters: Creep[] = _.difference(
    allH,
    _.filter(blacklist, (c: Creep | any) => c instanceof Creep)
  );
  const maxPayload = _.max(_.map(harvesters, (c) => c.carry[RESOURCE_ENERGY]));
  return creep.pos.findClosestByPath(harvesters, {
    filter: (c: Creep) => c.carry[RESOURCE_ENERGY] === maxPayload
  });
}

interface TargetItem {
  pos: RoomPosition;
  target: MuleTarget;
  prio: number;
}

function findTargetToRefill(creep: Creep): MuleTarget | null {
  const targets: TargetItem[] = [];

  _.each(
    creep.room.find<Creep>(FIND_MY_CREEPS, {
      filter: (c: Creep) =>
        c.carryCapacity &&
        c.memory.role !== 'harvester' &&
        c.memory.role !== 'mule'
    }),
    (c: Creep) =>
      targets.push({
        pos: c.pos,
        prio: 1000.0 * (c.carryCapacity - _.sum(c.carry)) / c.carryCapacity,
        target: c
      })
  );

  _.each(
    creep.room.find<EnergizedStructure>(FIND_MY_STRUCTURES, {
      filter: (s: EnergizedStructure) => s.isActive() && s.energyCapacity
    }),
    (s: EnergizedStructure) =>
      targets.push({
        pos: s.pos,
        prio: 100.0 * (s.energyCapacity - s.energy) / s.energyCapacity,
        target: s
      })
  );

  const maxPrio = _.max(_.map(targets, (t: TargetItem) => t.prio));
  const nearestTarget = creep.pos.findClosestByPath(targets, {
    filter: (t: TargetItem) => t.prio === maxPrio
  });

  return nearestTarget ? nearestTarget.target : null;
}
