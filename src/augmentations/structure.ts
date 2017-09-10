
Structure.prototype.toString = function(this: Structure): string {
  return `[Structure ${this.structureType}${this.pos}]`;
};
