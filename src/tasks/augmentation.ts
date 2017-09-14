import { log } from '../lib/logger/log';
import { deserialize } from './registry';
import { Task, TASK_IDLE, TaskType } from './task';
import { idleSingleton } from './types';

declare global {
  interface Creep {
    task: Task;
    stopTask(reason?: string): void;
    isIdle(): boolean;
    isTask(type: TaskType): boolean;
  }
}

type CreepWithTask = Creep & { _denormalizedTask?: boolean };

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,

  get(this: CreepWithTask): Task|undefined {
    if (!this._denormalizedTask) {
      try {
        const serialized = this.memory.task;
        this.memory.task = deserialize(serialized);
        log.debug('get task', serialized, '=>', this.memory.task);
      } catch (ex) {
        log.error('Error deserializing', this, 'task:', ex);
        this.memory.task = idleSingleton;
      }
      this.memory.task.creep = this;
      this._denormalizedTask = true;
    }
    return this.memory.task;
  },

  set(this: CreepWithTask, task: Task|undefined) {
    this.memory.task = task || idleSingleton;
    this.memory.task.creep = this;
    this._denormalizedTask = true;
  }
});

Creep.prototype.stopTask = function(this: Creep, reason: string = 'for reasons'): void {
  if (!this.isIdle()) {
    log.debug(`${this} stops to ${this.task}: ${reason}`);
  }
  this.task = idleSingleton;
};

Creep.prototype.isIdle = function(this: Creep) {
  return this.isTask(TASK_IDLE);
};

Creep.prototype.isTask = function(this: Creep, type: TaskType) {
  return this.task ? this.task.type === type : (type === TASK_IDLE);
};
