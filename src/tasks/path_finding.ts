
export function moveTo(creep: Creep, target: { pos: RoomPosition }, range: number): ResultCode {
  if (creep.pos.inRangeTo(target.pos, range)) {
    return OK;
  }
  const result = moveOneTo(creep, target.pos);
  if (result === OK || result === ERR_TIRED) {
    return result;
  }
  return moveByPathTo(creep, target, range);
}

const pathFinderOpts = { plainCost: 2, swampCost: 10, roomCallback: _.memoize(_roomCostMatrix) };

interface Path {
  target: { x: number; y: number };
  steps: Array<[number, number]>;
}

function moveByPathTo(creep: Creep, target: { pos: RoomPosition }, range: number): ResultCode {
  let result: ResultCode = ERR_NO_PATH;

  let path: Path | undefined = creep.memory.path;
  if (path) {
    result = tryPath(creep, target, path);
    if (result === OK || result === ERR_TIRED) {
      return result;
    }
    delete creep.memory.path;
  }

  const pathInfo = PathFinder.search(creep.pos, { pos: target.pos, range }, pathFinderOpts);
  if (pathInfo.path.length === 0) {
    return ERR_NO_PATH;
  }

  const steps = _.map(pathInfo.path, ({ x, y }) => [x, y] as [number, number]);
  path = { steps, target: { x: target.pos.x, y: target.pos.y } };
  result = tryPath(creep, target, path);
  if (result === OK || result === ERR_TIRED) {
    creep.memory.path = path;
  }
  return result;
}

function tryPath(
  creep: Creep,
  target: { pos: RoomPosition },
  path: Path
): ResultCode {
  if (!target.pos.isEqualTo(path.target.x, path.target.y)) {
    return ERR_NOT_FOUND;
  }
  const steps = path.steps;
  const n = steps.length;
  for (let i = 0; i < n; i++) {
    const [x, y] = steps[i]!;
    const result = moveOneTo(creep, new RoomPosition(x, y, creep.room.name));
    if (result === OK || result === ERR_TIRED) {
      creep.room.visual.poly(steps.slice(i), {
        lineStyle: 'dotted',
        opacity: 0.7,
        stroke: creep.color,
        strokeWidth: 0.1
      });
      steps.splice(0, i + 1);
      return result;
    }
  }
  return ERR_NOT_FOUND;
}

function moveOneTo(creep: Creep, pos: RoomPosition): ResultCode {
  if (!creep.pos.isNearTo(pos)) {
    return ERR_NOT_FOUND;
  }
  if (!canMoveTo(pos)) {
    return ERR_NO_PATH;
  }
  const dir = creep.pos.getDirectionTo(pos);
  return creep.move(dir);
}

function canMoveTo(pos: RoomPosition): boolean {
  return _.all(pos.look(), (res) => {
    switch (res.type) {
      case 'terrain':
        return res.terrain !== 'wall';
      case 'structure':
        return isTraversableStructure(res.structure!);
      case 'creep':
      case 'source':
      case 'mineral':
        return false;
      default:
        return true;
    }
  });
}

function isTraversableStructure(struct: Structure) {
  return (
    struct.structureType === STRUCTURE_ROAD
    || (struct.structureType === STRUCTURE_RAMPART && (struct as OwnedStructure).my)
  );
}

function _roomCostMatrix(name: string): CostMatrix | false {
  const room = Game.rooms[name];
  if (!room) {
    return false;
  }
  log.debug('Generating cost matrix for', name);
  const costs = new PathFinder.CostMatrix();

  for (const struct of room.find<OwnedStructure>(FIND_STRUCTURES)) {
    if (struct.structureType === STRUCTURE_ROAD) {
      costs.set(struct.pos.x, struct.pos.y, 1);
    } else if (!isTraversableStructure(struct)) {
      costs.set(struct.pos.x, struct.pos.y, 255);
    }
  }

  for (const creep of room.find<Creep>(FIND_CREEPS)) {
    costs.set(creep.pos.x, creep.pos.y, 255);
  }

  return costs;
}
