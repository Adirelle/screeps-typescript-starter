
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

Structure.prototype.isActive = function(this: Structure & {_isActive?: boolean}) {
  if (this._isActive !== undefined) {
    return this._isActive;
  }
  const isActive = _isActive.call(this);
  this._isActive = isActive;
  return isActive;
};

function isMine(this: Structure|OwnedStructure) {
  return (this as OwnedStructure).my === true;
}
Structure.prototype.isMine = isMine;

function isHostile(this: Structure|OwnedStructure) {
  return (this as OwnedStructure).my === false;
}
Structure.prototype.isHostile = isHostile;

function structTypeGuard(type: StructureType) {
  return function(this: Structure) { return this.structureType === type; };
}

Structure.prototype.isContainer = structTypeGuard(STRUCTURE_CONTAINER);
Structure.prototype.isController = structTypeGuard(STRUCTURE_CONTROLLER);
Structure.prototype.isExtension = structTypeGuard(STRUCTURE_EXTENSION);
Structure.prototype.isExtractor = structTypeGuard(STRUCTURE_EXTRACTOR);
Structure.prototype.isKeeperLair = structTypeGuard(STRUCTURE_KEEPER_LAIR);
Structure.prototype.isLab = structTypeGuard(STRUCTURE_LAB);
Structure.prototype.isLink = structTypeGuard(STRUCTURE_LINK);
Structure.prototype.isNuker = structTypeGuard(STRUCTURE_NUKER);
Structure.prototype.isObserver = structTypeGuard(STRUCTURE_OBSERVER);
Structure.prototype.isPortal = structTypeGuard(STRUCTURE_PORTAL);
Structure.prototype.isPowerBank = structTypeGuard(STRUCTURE_POWER_BANK);
Structure.prototype.isPowerSpawn = structTypeGuard(STRUCTURE_POWER_SPAWN);
Structure.prototype.isRampart = structTypeGuard(STRUCTURE_RAMPART);
Structure.prototype.isRoad = structTypeGuard(STRUCTURE_ROAD);
Structure.prototype.isSpawn = structTypeGuard(STRUCTURE_SPAWN);
Structure.prototype.isStorage = structTypeGuard(STRUCTURE_STORAGE);
Structure.prototype.isTerminal = structTypeGuard(STRUCTURE_TERMINAL);
Structure.prototype.isTower = structTypeGuard(STRUCTURE_TOWER);
Structure.prototype.isWall = structTypeGuard(STRUCTURE_WALL);

Structure.prototype.isTraversable = function(this: Structure): boolean {
  switch (this.structureType) {
    case STRUCTURE_ROAD:
      return true;
    case STRUCTURE_RAMPART:
    case STRUCTURE_CONTAINER:
      return this.isMine();
    default:
      return false;
  }
};
