import { Task, TASK_BUILD, TASK_GATHER, TASK_HARVEST, TASK_IDLE, TASK_PICKUP, TASK_REFILL, TASK_REPAIR, TASK_UPGRADE } from './task';
import { idleSingleton } from './types';
import * as Tasks from './types';

const planners: Array<(room: Room) => Task[]> = [
  Tasks.BuildTask.plan,
  Tasks.GatherTask.plan,
  Tasks.HarvestTask.plan,
  Tasks.RefillTask.plan,
  Tasks.RepairTask.plan,
  Tasks.UpgradeTask.plan,
  Tasks.PickupTask.plan
];

export function planTasks(room: Room) {
  return _.flatten(_.map(planners, (p) => p(room)));
}

const prototypes = {
  [TASK_BUILD]: Tasks.BuildTask.prototype,
  [TASK_GATHER]: Tasks.GatherTask.prototype,
  [TASK_HARVEST]: Tasks.HarvestTask.prototype,
  [TASK_REFILL]: Tasks.RefillTask.prototype,
  [TASK_REPAIR]: Tasks.RepairTask.prototype,
  [TASK_UPGRADE]: Tasks.UpgradeTask.prototype,
  [TASK_PICKUP]: Tasks.PickupTask.prototype
};

export function deserializeTask(data: any): Task {
  if (!data) {
    return idleSingleton;
  }
  if (!_.isPlainObject(data)) {
    throw new Error(`Invalid serialized data: ${data}`);
  }

  const type = data.type;
  if (type === TASK_IDLE) {
    return idleSingleton;
  } else if (!type || typeof type !== 'string' || !(type in prototypes)) {
    throw new Error(`Unknown task type: ${type}`);
  }
  const task = _.create(prototypes[type]);
  task.fromJSON(data);
  return task;
}
