
Object.defineProperties(Room.prototype, {
  creeps: {
    configurable: true,
    get(this: Room & { _creeps?: Creep[] }): Creep[] {
      if (!this._creeps) {
        this._creeps = this.find<Creep>(FIND_MY_CREEPS);
      }
      return this._creeps;
    }
  }
});

Room.prototype.toString = function(this: Room): string {
  return `[Room ${this.name}]`;
};
