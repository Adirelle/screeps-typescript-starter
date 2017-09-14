
Object.defineProperties(Creep.prototype, {
  color: {
    configurable: true,
    get(this: Creep): string { return '#' + this.id.substr(18, 6); }
  },
  energy: {
    configurable: true,
    get(this: Creep): number { return this.carry.energy || 0; }
  },
  payload: {
    configurable: true,
    get(this: Creep): number { return _.sum(this.carry) || 0; }
  }
});

Creep.prototype.isEmpty = function(this: Creep) {
  return this.carryCapacity > 0 && this.payload === 0;
};

Creep.prototype.isFull = function(this: Creep) {
  return this.payload === this.carryCapacity;
};

Creep.prototype.toString = function(this: Creep) {
  return `<font color="${this.color}">${this.name}</font>`;
};
