
Object.defineProperties(Room.prototype, {
  costMatrix: {
    configurable: true,
    get(this: Room & { _costMatrix?: CostMatrix }): CostMatrix {
      let costs = this._costMatrix;
      if (costs) {
        return costs;
      }
      const mem = this.memory._costMatrix;
      if (mem && mem.expiresAt < Game.time) {
        costs = PathFinder.CostMatrix.deserialize(mem.matrix);
      } else {
        costs = buildCostMatrix(this);
        this.memory._costMatrix = { matrix: costs.serialize(), expiresAt: Game.time + 2 };
      }
      return costs;
    }
  },
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

function buildCostMatrix(room: Room): CostMatrix {
  const costs = new PathFinder.CostMatrix();

  for (const s of room.find<Structure>(FIND_STRUCTURES)) {
    if (s.isRoad()) {
      costs.set(s.pos.x, s.pos.y, 1);
    } else if (!s.isTraversable()) {
      costs.set(s.pos.x, s.pos.y, 255);
    }
  }

  for (const creep of room.find<Creep>(FIND_CREEPS)) {
    costs.set(creep.pos.x, creep.pos.y, 255);
  }

  return costs;
}
