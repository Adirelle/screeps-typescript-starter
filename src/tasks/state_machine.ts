import { findRechargeTask, findWorkingTask } from './tasks';
import { EnergizedStructure, HarvestSpot, Outcome, State } from './types';

const states: { [name: string]: State } = {
  build: {
    action: (c, id) =>
      ifNotEmpty(c, () =>
        resolveId(id, (cs: ConstructionSite) => perform(c, cs, 3, c.build(cs)))
      ),
    transitions: doSame
  },
  default: {
    action: (c) => (c.isEmpty() ? 'recharge' : 'work'),
    transitions: _.identity
  },
  harvest: {
    action: (c, hs: HarvestSpot) => {
      if (c.isFull()) {
        return 'full';
      }
      const pos = new RoomPosition(hs.pos.x, hs.pos.y, hs.pos.roomName);
      return resolveId(
        hs.id,
        (s: Source) =>
          s.energy > 0 ? perform(c, { pos }, 0, c.harvest(s)) : 'done'
      );
    },
    transitions: doSame
  },
  idle: {
    action: (c) => {
      if (c.move(1 + Math.round(Math.random() * 7)) === OK) {
        return 'moving';
      } else {
        return 'default';
      }
    },
    transitions: _.constant('default')
  },
  pickup: {
    action: (c, id) =>
      ifNotFull(c, () =>
        resolveId(id, (r: Resource) => perform(c, r, 1, c.pickup(r)))
      ),
    transitions: doSame
  },
  recharge: {
    action: findRechargeTask,
    transitions: _.identity
  },
  refill: {
    action: (c, id) =>
      ifNotEmpty(c, () =>
        resolveId(
          id,
          (s: EnergizedStructure) =>
            s.energy < s.energyCapacity
              ? perform(c, s, 1, c.transfer(s, RESOURCE_ENERGY))
              : 'done'
        )
      ),
    transitions: doSame
  },
  upgrade: {
    action: (c, id) =>
      ifNotEmpty(c, () =>
        resolveId(id, (ctl: Controller) =>
          perform(c, ctl, 3, c.upgradeController(ctl))
        )
      ),
    transitions: doSame
  },
  withdraw: {
    action: (c, id) =>
      ifNotFull(c, () =>
        resolveId(
          id,
          (s: EnergizedStructure) =>
            s.energy > 0
              ? perform(c, s, 1, c.withdraw(s, RESOURCE_ENERGY))
              : 'done'
        )
      ),
    transitions: doSame
  },
  work: {
    action: findWorkingTask,
    transitions: _.identity
  }
};

export function iterate(creep: Creep): boolean {
  const prevValue = creep.memory.value;
  const current = creep.memory.state || 'default';
  const state = states[current] || states.default;

  let outcome: Outcome = 'failure';
  try {
    outcome = state.action(creep, creep.memory.value, current);
  } catch (ex) {
    log.error(`Error while performing ${current} for ${creep}`);
    log.trace(ex);
  }

  let value: any;
  if (typeof outcome !== 'string') {
    value = outcome.value;
    outcome = outcome.outcome;
    creep.memory.value = value;
  }

  const transitions = state.transitions;
  let newState = 'default';
  if (typeof transitions === 'function') {
    newState = transitions(outcome, current);
  } else {
    newState = transitions[outcome];
  }
  creep.memory.state = newState in states ? newState : 'default';

  log.debug(
    `${creep}: (${current}, ${prevValue}) => (${outcome}, ${value}) => (${creep
      .memory.state}, ${creep.memory.value})`
  );

  return newState !== current && outcome !== 'moving' && outcome !== 'success';
}

function doSame(outcome: string, current: string): string {
  switch (outcome) {
    case 'full':
      return 'work';
    case 'empty':
      return 'recharge';
    case 'moving':
    case 'success':
      return current;
    default:
      return 'default';
  }
}

function perform<T extends { pos: RoomPosition }>(
  creep: Creep,
  target: T,
  range: number,
  result: ResultCode
): Outcome {
  if (result === ERR_NOT_IN_RANGE) {
    result = moveTo(creep, target, range);
    if (result === OK || result === ERR_TIRED) {
      return 'moving';
    }
  }
  switch (result) {
    case ERR_FULL:
      return 'full';
    case ERR_NOT_ENOUGH_ENERGY:
    case ERR_NOT_ENOUGH_RESOURCES:
      return 'empty';
    case ERR_TIRED:
    case OK:
      return 'success';
    default:
      return 'failure';
  }
}

function ifNotEmpty(creep: Creep, fn: () => Outcome): Outcome {
  return creep.isEmpty() ? 'empty' : fn();
}

function ifNotFull(creep: Creep, fn: () => Outcome): Outcome {
  return creep.isFull() ? 'full' : fn();
}

function resolveId<T, R>(id: string, fn: (obj: T) => R): R {
  const obj = Game.getObjectById<T>(id);
  if (!obj) {
    throw new Error(`Unknown game object ${id}`);
  }
  return fn(obj);
}

interface Path {
  target: { x: number; y: number };
  steps: Array<[number, number]>;
}

const roomCostMatrix = _.memoize(_roomCostMatrix);

function moveTo(
  creep: Creep,
  target: { pos: RoomPosition },
  range: number
): ResultCode {
  let path: Path | undefined = creep.memory.path;
  let result: ResultCode = ERR_NO_PATH;
  if (path) {
    result = tryPath(creep, target, path);
    if (result === OK || result === ERR_TIRED) {
      return result;
    }
    delete creep.memory.path;
  }
  const pathInfo = PathFinder.search(
    creep.pos,
    { pos: target.pos, range },
    {
      maxOps: 1000,
      plainCost: 2,
      roomCallback: roomCostMatrix,
      swampCost: 10
    }
  );
  log.debug(`PathFinder: from ${creep.pos} to ${target.pos} => ${JSON.stringify(pathInfo)}`);
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

const directions: Array<Direction | undefined> = [
  TOP_LEFT,
  TOP,
  TOP_RIGHT,
  LEFT,
  undefined,
  RIGHT,
  BOTTOM_LEFT,
  BOTTOM,
  BOTTOM_RIGHT
];

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
    if (creep.pos.isNearTo(x, y)) {
      const j = 4 + 3 * (y - creep.pos.y) + (x - creep.pos.x);
      const dir = directions[j];
      if (dir) {
        creep.room.visual.poly(steps.slice(i), {
          lineStyle: 'dotted',
          opacity: 0.7,
          stroke: creep.color,
          strokeWidth: 0.1
        });
        steps.splice(0, i);
        return creep.move(dir);
      }
    }
  }
  return ERR_NOT_FOUND;
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
    } else if (
      struct.structureType !== STRUCTURE_CONTAINER &&
      (struct.structureType !== STRUCTURE_RAMPART || !struct.my)
    ) {
      costs.set(struct.pos.x, struct.pos.y, 255);
    }
  }

  for (const creep of room.find<Creep>(FIND_CREEPS)) {
    costs.set(creep.pos.x, creep.pos.y, 255);
  }

  return costs;
}
