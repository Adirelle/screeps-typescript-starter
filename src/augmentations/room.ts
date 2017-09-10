import { log } from '../lib/logger/log';

Object.defineProperties(Room.prototype, {
  creeps: {
    configurable: true,
    get(): Creep[] {
      if (!this._creeps) {
        this._creeps = (this as Room).find<Creep>(FIND_MY_CREEPS);
        log.debug('get creeps', '=>', this._creeps);
      }
      return this._creeps;
    }
  }
});

Room.prototype.toString = function(this: Room): string {
  return `[Room ${this.name}]`;
};
