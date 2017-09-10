import { log } from '../lib/logger/log';
import { serialize, unserialize } from '../lib/serializer';
import { Task } from './task';
import { idleSingleton } from './types/idle';

declare global {
  interface Creep {
    task: Task;
    assign(task: Task): void;
    stopTask(): void;
    isIdle(): boolean;
    isTask(type: string): boolean;
  }
}

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,
  get(): Task {
    if (this._task) {
      return this._task;
    }
    try {
      this._task = this.memory.task ? unserialize(this.memory.task) : idleSingleton;
    } catch (err) {
      log.error(err);
      delete this.memory.task;
      this._task = idleSingleton;
    }
    return this._task;
  },
  set(task: Task) {
    if (task === this._task) {
      return;
    }
    this._task = task;
    if (task !== idleSingleton) {
      this.memory.task = serialize(this._task);
    } else {
      delete this.memory.task;
    }
  }
});

Creep.prototype.assign = function(this: Creep, task: Task): void {
  this.task = task;
};

Creep.prototype.stopTask = function(this: Creep): void {
  this.task = idleSingleton;
};

Creep.prototype.isIdle = function(this: Creep) {
  return this.task === idleSingleton;
};

Creep.prototype.isTask = function(this: Creep, type: string) {
  return this.task ? this.task.type === type : false;
};
