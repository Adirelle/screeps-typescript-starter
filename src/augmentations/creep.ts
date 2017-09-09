
Object.defineProperties(Creep.prototype, {
  energy: {
    configurable: true,
    get(): number { return this.carry.energy || 0; }
  },
  payload: {
    configurable: true,
    get(): number { return _.sum(this.carry) || 0; }
  }
});

Creep.prototype.isEmpty = function(this: Creep) {
  return this.carryCapacity > 0 && this.payload === 0;
};

Creep.prototype.isFull = function(this: Creep) {
  return this.payload === this.carryCapacity;
};
