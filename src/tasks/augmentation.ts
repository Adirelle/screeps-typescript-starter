import * as Registry from './registry';
import { Task, TASK_IDLE, TaskType } from './task';
import { idleSingleton } from './types';

declare global {
  interface Creep {
    task: Task;
    stopTask(): void;
    isIdle(): boolean;
    isTask(type: TaskType): boolean;
  }
}

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,

  get(this: Creep & { _task?: Task }): Task|undefined {
    if (this._task !== undefined) {
      return this._task;
    }
    if (typeof (this.memory.task) === 'string') {
      const task = this._task = Registry.deserialize(this.memory.task);
      task.creep = this;
      return task;
    }
    delete this.memory.task;
    this._task = idleSingleton;
  },

  set(this: Creep & { _task?: Task }, task: Task|undefined) {
    task = task || idleSingleton;
    const prev = this._task;
    if (task === prev) {
      return;
    }
    this._task = task;
    this.memory.task = Registry.serialize(task);
    task.creep = this;
    if (prev) {
      delete prev.creep;
    }
  }
});

Creep.prototype.stopTask = function(this: Creep): void {
  this.task = idleSingleton;
};

Creep.prototype.isIdle = function(this: Creep) {
  return this.isTask(TASK_IDLE);
};

Creep.prototype.isTask = function(this: Creep, type: TaskType) {
  return this.task ? this.task.type === type : (type === TASK_IDLE);
};
