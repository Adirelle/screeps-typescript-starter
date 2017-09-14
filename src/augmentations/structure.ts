
Structure.prototype.toString = function(this: Structure): string {
  return `[${this.structureType}${this.pos}]`;
};

const _isActive = Structure.prototype.isActive;
Structure.prototype.isActive = function(this: Structure & {_isActive?: boolean}) {
  if (this._isActive !== undefined) {
    return this._isActive;
  }
  const isActive = _isActive.call(this);
  this._isActive = isActive;
  return isActive;
};
