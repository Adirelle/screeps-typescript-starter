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

  const prio = taskList[0].priority;
  let n = 1;
  while (n < taskList.length && taskList[n].priority === prio) {
    n++;
  }
  log.debug(`Considering the first ${n} task(s) of ${taskList.length} at priority ${prio}`);

  const choices = taskList.slice(0, n);
  const task = creep.pos.findClosestByPath<Task>(choices);
  log.debug(`Result: ${JSON.stringify(task)}`);

  if (!task) {
    return 'idle';
  }

  _.pull(taskList, task);
  log.debug(`${taskList.length} remaining task(s)`);

  return { outcome: task.name, value: task.value };
}

const findHarvestSpots = _.memoize (_findHarvestSpots, _.property('name'));

function initTasks() {
  if (tasks.initialized) {
    return;
  }
  tasks.charging = [];
  tasks.working = [];

  for (const r of room.find<Resource>(FIND_DROPPED_RESOURCES)) {
    if ( r.resourceType === RESOURCE_ENERGY) {
      tasks.charging.push({ name: 'pickup', priority: 100, pos: r.pos, value: r.id });
    }
  }

  for (const hs of findHarvestSpots(room)) {
    tasks.charging.push({ name: 'harvest', priority: 90, pos: hs.pos, value: hs });
  }

  for (const s of room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES)) {
    tasks.working.push({ name: 'build', priority: 100, pos: s.pos, value: s.id });
  }

  for (const s of room.myActiveStructures as EnergizedStructure[]) {
    switch (s.structureType) {
      case STRUCTURE_SPAWN:
      case STRUCTURE_EXTENSION:
        if (s.energy < s.energyCapacity) {
          tasks.working.push({ name: 'refill', priority: 90, pos: s.pos, value: s.id });
        }
        break;

      case STRUCTURE_TOWER:
        if (s.energy < s.energyCapacity) {
          tasks.working.push({ name: 'refill', priority: 80, pos: s.pos, value: s.id });
        }
        break;

      case STRUCTURE_LINK:
        if (s.energy > 0) {
          tasks.charging.push({ name: 'withdraw', priority: 80, pos: s.pos, value: s.id });
        }
        if (s.energy < s.energyCapacity) {
          tasks.working.push({ name: 'refill', priority: 60, pos: s.pos, value: s.id });
        }
        break;
      }
  }

  const c = room.controller;
  if (c && c.my) {
    tasks.working.push({ name: 'upgrade', priority: 70, pos: c.pos, value: c.id });
  }

  tasks.working.sort((a, b) => b.priority - a.priority);
  tasks.charging.sort((a, b) => b.priority - a.priority);
  log.debug(`Found ${tasks.working.length} working task(s) and ${tasks.charging.length} charging one(s)`);

  tasks.initialized = true;
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
