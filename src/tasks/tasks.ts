import { EnergizedStructure, HarvestSpot, Outcome, Task } from './types';

let room: Room;

const tasks: {
  charging: Task[];
  working: Task[];
  initialized: boolean;
} = { charging: [], working: [], initialized: false };

export function resetTasks(theRoom: Room) {
  room = theRoom;
  tasks.initialized = false;
}

export function findRechargeTask(creep: Creep): Outcome {
  initTasks();
  return findTask(creep, tasks.charging);
}

export function findWorkingTask(creep: Creep): Outcome {
  initTasks();
  return findTask(creep, tasks.working);
}

export function findTask(creep: Creep, taskList: Task[]): Outcome {
  if (!taskList.length) {
    return 'idle';
  }

  const num = taskList.length;
  for (let i = 0, n = 1; i < num; i += n) {
    const prio = taskList[i].priority;
    while (i + n < num && taskList[i + n].priority === prio) {
      n++;
    }
    log.debug(`Considering task(s) ${i}-${i + n - 1}/${num}, priority: ${prio}`);

    const choices = taskList.slice(i, n);
    const task = creep.pos.findClosestByPath<Task>(choices, {filter: (t: Task) => (t.multiple || !isAssigned(t))});
    log.debug(`Result: ${JSON.stringify(task)}`);

    if (task) {
      task.assigned = !task.multiple;
      return { outcome: task.name, value: task.value };
    }
  }

  return 'idle';
}

function isAssigned(task: Task): boolean {
  if (typeof task.assigned === 'undefined') {
    task.assigned = _.any(room.myCreeps, (c) => (
      c.memory.state === task.name && _.isEqual(c.memory.value, task.value)
    ));
  }
  log.debug(`isAssigned: ${JSON.stringify(task)}`);
  return task.assigned;
}

const findHarvestSpots = _.memoize (_findHarvestSpots, _.property('name'));

function initTasks() {
  if (tasks.initialized) {
    return;
  }
  tasks.charging = [];
  tasks.working = [];

  listPickupTasks();
  listHarvestTasks();
  listConstructionTasks();
  listStructureTasks();

  tasks.working.sort((a, b) => b.priority - a.priority);
  tasks.charging.sort((a, b) => b.priority - a.priority);
  log.debug(`Found ${tasks.working.length} working task(s) and ${tasks.charging.length} charging one(s)`);

  tasks.initialized = true;
}

function listPickupTasks() {
  for (const r of room.find<Resource>(FIND_DROPPED_RESOURCES)) {
    if ( r.resourceType === RESOURCE_ENERGY) {
      tasks.charging.push({ name: 'pickup', priority: 100, pos: r.pos, value: r.id });
    }
  }
}

function listHarvestTasks() {
  for (const hs of findHarvestSpots(room)) {
    tasks.charging.push({ name: 'harvest', priority: 90, pos: hs.pos, value: hs });
  }
}

function listConstructionTasks() {
  for (const s of room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES)) {
    tasks.working.push({ name: 'build', priority: 100, pos: s.pos, value: s.id, multiple: true });
  }
}

const refillPrio = {
  [STRUCTURE_TOWER]: 100,
  [STRUCTURE_SPAWN]: 90,
  [STRUCTURE_EXTENSION]: 90,
  [STRUCTURE_LINK]: 60,
  default: 10
};

function listStructureTasks() {
  for (const s of room.myActiveStructures as EnergizedStructure[]) {
    if (s.energyCapacity > 0 && s.energy < s.energyCapacity) {
      const prio = refillPrio[s.structureType] || refillPrio.default;
      tasks.working.push({ name: 'refill', pos: s.pos, priority: prio, value: s.id, multiple: true });
    }

    if (s instanceof StructureLink) {
      if (s.energy > 0) {
        tasks.charging.push({ name: 'withdraw', priority: 80, pos: s.pos, value: s.id });
      }
    }

    if (s instanceof StructureController) {
      if (s.ticksToDowngrade < 5000) {
        tasks.working.push({ name: 'upgrade', priority: 150, pos: s.pos, value: s.id });
      }
      tasks.working.push({ name: 'upgrade', priority: 80, pos: s.pos, value: s.id, multiple: true });
    }
  }
}

// Harvesting helper

function _findHarvestSpots(r: Room): HarvestSpot[] {
  const spots: HarvestSpot[] = [];
  _.each(r.find<Source>(FIND_SOURCES_ACTIVE), (source) => {
    _.each(
      r.lookForAtArea(
        LOOK_TERRAIN,
        source.pos.y - 1,
        source.pos.x - 1,
        source.pos.y + 1,
        source.pos.x + 1,
        true
      ),
      ({ x, y, terrain }: LookAtResultWithPos) => {
        if (terrain === 'swamp' || terrain === 'plain') {
          spots.push({ id: source.id, pos: new RoomPosition(x, y, r.name) });
        }
      }
    );
  });
  return spots;
}
