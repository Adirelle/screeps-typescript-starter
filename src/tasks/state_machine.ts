import { getAssignedTask } from './tasks';
import { EnergizedStructure, Outcome, State } from './types';

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
    action: (c, t) => {
      if (c.isFull()) {
        return 'full';
      }
      return resolveId(
        t,
        (s: Source) =>
          s.energy > 0 ? perform(c, s, 1, c.harvest(s)) : 'done'
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
    action: getAssignedTask,
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
    action: getAssignedTask,
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
  addActionVisual(creep, target);
  if (result === ERR_NOT_IN_RANGE) {
    result = creep.moveToGoal(target, range);
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
    case OK:
      return 'success';
    default:
      return 'failure';
  }
}

function addActionVisual<T extends { pos: RoomPosition }>(creep: Creep, target: T): void {
  const room = Game.rooms[target.pos.roomName]!;
  room.visual.circle(
    target.pos.x, target.pos.y,
    { fill: 'transparent', opacity: 0.7, stroke: creep.color, strokeWidth: 0.1, radius: 0.4 }
  );
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
