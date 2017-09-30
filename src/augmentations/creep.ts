
Object.defineProperties(Creep.prototype, {
  color: {
    configurable: true,
    get(this: Creep): string { return '#' + this.id.substr(18, 6); }
  },
  energy: {
    configurable: true,
    get(this: Creep): number { return this.carry.energy || 0; }
  },
  energyCapacity: {
    configurable: true,
    get(this: Creep): number { return this.energy + this.carryCapacity - this.payload; }
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

Creep.prototype.canMoveTo = function(this: Creep, xOrPos: number|RoomPosition, y?: number, roomName?: string): boolean {
  if (xOrPos instanceof RoomPosition) {
    return canMoveTo(xOrPos);
  }
  if (typeof y === 'number') {
    return canMoveTo(new RoomPosition(xOrPos, y, roomName || this.pos.roomName));
  }
  throw new TypeError(`Invalid arguments to Creep.prototype.canMoveTo: ${JSON.stringify(arguments)}`);
};

Creep.prototype.moveOneTo = function(this: Creep, xOrPos: number|RoomPosition, y?: number, roomName?: string): ResultCode {
  if (xOrPos instanceof RoomPosition) {
    return moveOneTo(this, xOrPos);
  }
  if (typeof y === 'number') {
    return moveOneTo(this, new RoomPosition(xOrPos, y, roomName || this.pos.roomName));
  }
  throw new TypeError(`Invalid arguments to Creep.prototype.moveOneTo: ${JSON.stringify(arguments)}`);
};

Creep.prototype.moveToGoal = function(
  this: Creep,
  xOrPosOrGoal: number|RoomPosition|{ pos: RoomPosition, range?: number },
  yOrRange?: number,
  range?: number,
  roomName?: string
): ResultCode {
  if (xOrPosOrGoal instanceof RoomPosition) {
    return moveToGoal(this, xOrPosOrGoal, yOrRange || 0);
  }
  if (typeof xOrPosOrGoal === 'number' && typeof yOrRange === 'number') {
    return moveToGoal(this, new RoomPosition(xOrPosOrGoal, yOrRange, roomName || this.pos.roomName), range || 0);
  }
  if (typeof xOrPosOrGoal === 'object') {
    return moveToGoal(this, xOrPosOrGoal.pos, xOrPosOrGoal.range || range || 0);
  }
  throw new TypeError(`Invalid arguments for Creep.prototype.moveToGoal: ${JSON.stringify(arguments)}`);
};

function moveToGoal(creep: Creep, pos: RoomPosition, range: number): ResultCode {
  if (creep.pos.inRangeTo(pos, range)) {
    return OK;
  }
  const result = moveOneTo(creep, pos);
  if (result === OK || result === ERR_TIRED) {
    return result;
  }
  return moveByPathTo(creep, pos, range);
}

interface Path {
  pos: RoomPosition;
  steps: RoomPosition[];
}

function moveByPathTo(creep: Creep, pos: RoomPosition, range: number): ResultCode {
  let result: ResultCode = ERR_NO_PATH;

  let path: Path | undefined = creep.memory.path;
  if (path) {
    result = tryPath(creep, pos, path);
    if (result === OK || result === ERR_TIRED) {
      return result;
    }
    delete creep.memory.path;
  }

  const pathInfo = PathFinder.search(creep.pos, { pos, range }, {
    plainCost: 2,
    roomCallback: (name) => Game.rooms[name].costMatrix,
    swampCost: 10
  });
  if (pathInfo.path.length === 0) {
    return ERR_NO_PATH;
  }

  path = { pos, steps: pathInfo.path };
  result = tryPath(creep, pos, path);
  if (result === OK || result === ERR_TIRED) {
    creep.memory.path = path;
  }
  return result;
}

function tryPath(creep: Creep, pos: RoomPosition, path: Path): ResultCode {
  if (!pos.isEqualTo(path.pos.x, path.pos.y)) {
    return ERR_NOT_FOUND;
  }
  const steps = path.steps;
  const n = steps.length;
  for (let i = 0; i < n; i++) {
    const result = moveOneTo(creep, steps[i]!);
    if (result === OK || result === ERR_TIRED) {
      steps.splice(0, i + (result === OK ? 1 : 0));
      creep.room.visual.poly(
        _.map(steps, ({x, y}) => [x, y] as [number, number]),
        {
          lineStyle: 'dotted',
          opacity: 0.7,
          stroke: creep.color,
          strokeWidth: 0.1
        }
      );
      return result;
    }
  }
  return ERR_NOT_FOUND;
}

function moveOneTo(creep: Creep, pos: RoomPosition): ResultCode {
  if (!creep.pos.isNearTo(pos)) {
    return ERR_NOT_FOUND;
  }
  if (canMoveTo(pos)) {
    return ERR_NO_PATH;
  }
  return creep.move(creep.pos.getDirectionTo(pos));
}

function canMoveTo(pos: RoomPosition): boolean {
  return _.all(pos.look(), (res) => {
    switch (res.type) {
      case 'terrain':
        return res.terrain !== 'wall';
      case 'structure':
        return res.structure!.isTraversable();
      case 'creep':
      case 'source':
      case 'mineral':
        return false;
      default:
        return true;
    }
  });
}
