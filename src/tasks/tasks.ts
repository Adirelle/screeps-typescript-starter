import { BaseTask, Outcome, Task, TaskType } from './types';

const tasksByType: { recharge?: Task[], work?: Task[] } = {};
let room: Room;
let assignations: { [name: string]: Task } = {};

export function resetTasks(theRoom: Room) {
  room = theRoom;
  assignations = {};
  delete tasksByType.recharge;
  delete tasksByType.work;
}

export function assignTasks(): void {
  for (const type of ['recharge', 'work'] as TaskType[]) {
    const creeps = _.filter(room.myCreeps, (c) => c.memory.state === type);
    if (!creeps.length) {
      continue;
    }
    log.debug(`${creeps.length} creep(s) to ${type}`);

    const tasks = findTasks(type);
    if (!tasks.length) {
      continue;
    }

    _.remove(tasks, _.property('assigned'));
    log.debug(`${tasks.length} available task(s)`);
    if (tasks.length) {
      tasks.sort((a, b) => b.priority - a.priority);
      assignTasksByType(tasks, creeps);
    }
  }
}

export function getAssignedTask(creep: Creep): Outcome {
  const task = assignations[creep.name];
  if (!task) {
    return 'idle';
  }
  log.debug(`${creep} has been assigned task ${task}`);
  return task.toOutcome();
}

function assignTasksByType(tasks: Task[], creeps: Creep[]): void {
  for (let i = 0, j; i < tasks.length && creeps.length > 0; i = j) {

    const prio = tasks[i].priority;
    j = i + 1;
    while (j < tasks.length && tasks[j].priority === prio) {
      j++;
    }

    let creep;
    let task;
    if (j - i > creeps.length) {
      creep = creeps[0];
      task = creep.pos.findClosestByPath(tasks.slice(i, j));
    } else {
      task = tasks[i];
      creep = task.pos.findClosestByPath(creeps);
    }
    if (creep && task) {
      log.debug(`${task} assigned to ${creep}`);
      assignations[creep.name] = task;
      task.assigned = true;
      _.pull(creeps, creep);
    }
  }
}

function findTasks(type: TaskType): Task[] {
  let tasks = tasksByType[type];
  if (tasks) {
    return tasks;
  }

  tasks =  (type === 'recharge') ? findRechargeTasks() : findWorkTasks();
  _.remove(tasks, (t) => _.any(room.myCreeps, t.checkAssignation.bind(t)));

  tasksByType[type] = tasks;
  return tasks;
}

function findRechargeTasks(): Task[] {
  return findPickupTasks().concat(findHarvestTasks(), findWithdrawTasks());
}

function findWorkTasks(): Task[] {
  return findRefillTasks().concat(findBuildTasks(), findUpgradeTasks());
}

function findPickupTasks(): Task[] {
  return _.map(
    _.filter(room.find<Resource>(FIND_DROPPED_RESOURCES), (r) => r.resourceType === RESOURCE_ENERGY),
    (r) => new BaseTask('pickup', r, 100)
  );
}

// const findHarvestSpots = _.memoize(_findHarvestSpots, _.property('name'));

function findHarvestTasks(): Task[] {
  // return _.map(findHarvestSpots(room), (hs) => new BaseTask('harvest', hs, 90));
  return _.map(
    room.find<Source>(FIND_SOURCES, {filter: (s: Source) => s.energy > 0}),
    (s) => new BaseTask('harvest', s, 90)
  );
}

function findBuildTasks(): Task[] {
  return _.map(
    room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES),
    (s) => new BaseTask('build', s, 100)
  );
}

function findRefillTasks(): Task[] {
  return _.map(
    _.filter(
      room.myActiveStructures,
      (s) => isEnergyContainer(s) && s.energy < s.energyCapacity
    ),
    (s) => new BaseTask('refill', s, getRefillPriority(s.structureType))
  );
}

function getRefillPriority(type: StructureType) {
  switch (type) {
    case STRUCTURE_TOWER:
      return 100;
    case STRUCTURE_SPAWN:
    case STRUCTURE_EXTENSION:
      return room.myCreeps.length < 10 ? 110 : 90;
    case STRUCTURE_LINK:
      return 60;
    default:
      return 10;
  }
}

function findWithdrawTasks(): Task[] {
  return _.map(
    _.filter(room.myActiveStructures, (s) => s.isLink() && s.energy > 0),
    (s) => new BaseTask('withdraw', s, 80)
  );
}

function findUpgradeTasks(): Task[] {
  const c = room.controller;
  if (c && c.isMine()) {
    return [new BaseTask('upgrade', c, c.ticksToDowngrade < 5000 ? 150 : 80)];
  }
  return [];
}

// Harvesting helper

// function _findHarvestSpots(r: Room): HarvestSpot[] {
//   const spots: HarvestSpot[] = [];
//   _.each(r.find<Source>(FIND_SOURCES_ACTIVE), (source) => {
//     _.each(
//       r.lookForAtArea(
//         LOOK_TERRAIN,
//         source.pos.y - 1,
//         source.pos.x - 1,
//         source.pos.y + 1,
//         source.pos.x + 1,
//         true
//       ),
//       ({ x, y, terrain }: LookAtResultWithPos) => {
//         if (terrain === 'swamp' || terrain === 'plain') {
//           spots.push({ id: source.id, pos: new RoomPosition(x, y, r.name) });
//         }
//       }
//     );
//   });
//   return spots;
// }

/*

export function findTask(creep: Creep, taskList: Task[]): Outcome {
  const num = taskList.length;
  for (let i = 0, n; i < num; i = n) {
    const prio = taskList[i].priority;
    for (n = i + 1; n < num && taskList[n].priority === prio; n++) {
        // Next
    }
    log.debug(`Considering task(s) ${i}-${n - 1}/${num}, priority: ${prio}`);

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
*/
