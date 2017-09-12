import { denormalize, normalize } from './normalizer';
import { Task, TASK_BUILD, TASK_GATHER, TASK_HARVEST, TASK_IDLE, TASK_REFILL, TASK_REPAIR, TASK_UPGRADE } from './task';
import * as Tasks from './types';

const planners: Array<(room: Room) => Task[]> = [
  Tasks.BuildTask.plan,
  Tasks.GatherTask.plan,
  Tasks.HarvestTask.plan,
  Tasks.RefillTask.plan,
  Tasks.RepairTask.plan,
  Tasks.UpgradeTask.plan
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
  [TASK_UPGRADE]: Tasks.UpgradeTask.prototype
};

export function serialize(task?: Task) {
  if (!task || task.type === TASK_IDLE) {
    return undefined;
  }
  return JSON.stringify(normalize(task));
}

export function deserialize(json?: string): Task {
  if (json === undefined) {
    return Tasks.idleSingleton;
  }

  const plain = denormalize(JSON.parse(json));
  if (!_.isPlainObject(plain)) {
    throw new Error(`Invalid deserialized data: ${json}`);
  }

  const type = plain.type;
  if (type === TASK_IDLE) {
    return Tasks.idleSingleton;
  } else if (!type || typeof type !== 'string' || !(type in prototypes)) {
    throw new Error(`Unknown task type: ${type}`);
  }
  return _.create(prototypes[type], plain);
}
