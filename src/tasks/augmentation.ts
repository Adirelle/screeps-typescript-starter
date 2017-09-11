import { reviveTask } from './registry';
import { Task, TaskType } from './task';
import { idleSingleton } from './types';

declare global {
  interface Creep {
    task?: Task;
    stopTask(): void;
    isIdle(): boolean;
    isTask(type: TaskType): boolean;
  }
}

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,
  get(this: Creep & { _task?: Task }): Task {
    if (this._task) {
      return this._task;
    }
    this._task = reviveTask(this.memory.task);
    this._task.creep = this;
    return this._task;
  },
  set(this: Creep & { _task?: Task }, task: Task) {
    const prev = this._task;
    if (task === prev) {
      return;
    }
    this._task = task;
    if (prev) {
      delete prev.creep;
    }
    task.creep = this;
  }
});

Creep.prototype.stopTask = function(this: Creep): void {
  this.task = idleSingleton;
};

Creep.prototype.isIdle = function(this: Creep) {
  return this.isTask(TaskType.IDLE);
};

Creep.prototype.isTask = function(this: Creep, type: TaskType) {
  return this.task ? this.task.type === type : (type === TaskType.IDLE);
};
