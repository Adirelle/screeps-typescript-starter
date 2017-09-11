import { Planner, Task, TaskType } from './task';
import * as Types from './types';

const planners: Planner[] = [
  Types.planBuilds,
  Types.planGathers,
  Types.planHarvests,
  Types.planRefills,
  Types.planRepairs,
  Types.planUpgrades
];

export function planTasks(room: Room): Task[] {
  return _.flatten(_.map(planners, (p) => p(room)));
}

const ctors: { [type: string]: new (creep: Creep) => Task } = {
  [TaskType.BUILD]: Types.BuildTask,
  [TaskType.GATHER]: Types.GatherTask,
  [TaskType.HARVEST]: Types.HarvestTask,
  [TaskType.REFILL]: Types.RefillTask,
  [TaskType.REPAIR]: Types.RepairTask,
  [TaskType.UPGRADE]: Types.UpgradeTask
};

export function reviveTask(creep: Creep): Task {
  const memory = creep.memory.task;
  if (typeof memory === 'undefined' || memory.type === TaskType.IDLE) {
    return Types.idleSingleton;
  }
  const ctor = ctors[memory.type];
  if (!ctor) {
    throw new Error(`Unknown task type ${memory.type}`);
  }
  return new ctor(creep);
}
