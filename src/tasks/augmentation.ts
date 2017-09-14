import { deserializeTask } from './registry';
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

type CreepWithTask = Creep & { _taskDeserialized?: boolean };

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,

  get(this: CreepWithTask): Task|undefined {
    if (!this._taskDeserialized) {
      try {
        const data = this.memory.task;
        this.memory.task = deserializeTask(data);
      } catch (ex) {
        log.error(`Error deserializing ${this} task: ${ex}`);
        this.memory.task = idleSingleton;
      }
      this.memory.task.creep = this;
      this._taskDeserialized = true;
    }
    return this.memory.task;
  },

  set(this: CreepWithTask, task: Task|undefined) {
    this.memory.task = task || idleSingleton;
    this.memory.task.creep = this;
    this._taskDeserialized = true;
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
