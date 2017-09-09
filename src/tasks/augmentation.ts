import { log } from '../lib/logger/log';
import { serialize, unserialize } from '../lib/serializer';
import { registry } from './registry';
import { Task } from './task';

declare global {
  interface Creep {
    task?: Task;
    canAssign(task: Task): boolean;
    assign(task: Task): void;
    hasBodyParts(parts: BodyPartType[]): boolean;
    isIdle(): boolean;
    hasTask(type: string): boolean;
  }
}

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,
  get(): Task|undefined {
    if (!this._task) {
      return this._task || undefined;
    }
    const unserialized = this.memory.task;
    if (typeof unserialized !== 'object' || !unserialized.type) {
      this._task = null;
      return;
    }
    this._task = unserialize(unserialized);
    return this._task;
  },
  set(task: Task|undefined) {
    if (task === this._task) {
      return;
    }
    this._task = task || null;
    if (task) {
      this.memory.task = serialize(task);
    } else {
      delete this.memory.task;
    }
  }
});

Creep.prototype.canAssign = function(this: Creep, task: Task): boolean {
  return registry.isCompatible(this, task) && (!this.task || this.task.priority < task.priority);
};

Creep.prototype.assign = function(this: Creep, task: Task): void {
  if (!this.canAssign(task)) {
    throw new Error(`${this.name} cannot be assigned ${task}`);
  }
  this.task = task;
};

Creep.prototype.hasBodyParts = function(this: Creep, parts: BodyPartType[]) {
  _.each(this.body, ({type, hits}) => log.debug(type, hits));
  return _.all(parts, (part) => this.getActiveBodyparts(part) > 0);
};

Creep.prototype.isIdle = function(this: Creep) {
  return !this.task || this.task.type === 'idle';
};

Creep.prototype.hasTask = function(this: Creep, type: string) {
  return this.task ? this.task.type === type : false;
};
