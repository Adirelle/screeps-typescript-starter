
Object.defineProperties(Room.prototype, {
  myActiveStructures: {
    configurable: true,
    get(this: Room & { _myActiveStructures?: Structure[] }): Structure[] {
      if (this._myActiveStructures !== undefined) {
        return this._myActiveStructures;
      }
      const result =  _.filter(this.myStructures, (s) => s.isActive());
      this._myActiveStructures = result;
      return result;
    }
  },
  myCreeps: {
    configurable: true,
    get(this: Room & { _myCreeps?: Creep[] }): Creep[] {
      if (this._myCreeps !== undefined) {
        return this._myCreeps;
      }
      const result =  this.find<Creep>(FIND_MY_CREEPS);
      this._myCreeps = result;
      return result;
    }
  },
  myStructures: {
    configurable: true,
    get(this: Room & { _myStructures?: Structure[] }): Structure[] {
      if (this._myStructures !== undefined) {
        return this._myStructures;
      }
      const result =  this.find<Structure>(FIND_MY_STRUCTURES);
      this._myStructures = result;
      return result;
    }
  }
});

Room.prototype.toString = function(this: Room): string {
  return `[Room ${this.name}]`;
};
