import { serialize, unserialize } from '../lib/serializer';
import { registry } from './registry';
import { Task } from './task';

declare global {
  interface Creep {
    task: Task|null;
    canAssign(task: Task): boolean;
    assign(task: Task): void;
    hasBodyParts(parts: BodyPartType[]): boolean;
    isIdle(): boolean;
    hasTask(type: string): boolean;
  }
}

Object.defineProperty(Creep.prototype, 'task', {
  configurable: true,
  get(): Task|null {
    if (this._task !== undefined) {
      return this._task;
    }
    const unserialized = this.memory.task;
    if (typeof unserialized !== 'object' || !unserialized.type) {
      delete this.memory.task;
      this._task = null;
      return null;
    }
    this._task = unserialize(unserialized);
    return this._task;
  },
  set(task: Task|null) {
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
  return (!this.task || this.task.priority < task.priority) && registry.isCompatible(this, task);
};

Creep.prototype.assign = function(this: Creep, task: Task): void {
  if (!this.canAssign(task)) {
    throw new Error(`${this.name} cannot be assigned ${task}`);
  }
  this.task = task;
};

Creep.prototype.hasBodyParts = function(this: Creep, parts: BodyPartType[]) {
  return _.all(parts, (part) => this.getActiveBodyparts(part) > 0);
};

Creep.prototype.isIdle = function(this: Creep) {
  return !this.task || this.task.type === 'idle';
};

Creep.prototype.hasTask = function(this: Creep, type: string) {
  return this.task ? this.task.type === type : false;
};
