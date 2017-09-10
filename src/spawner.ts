import { log } from './lib/logger/log';

class BodyType {
  public readonly bodyCost: number;

  constructor(
    public readonly type: string,
    public readonly num: number,
    public readonly priority: number,
    public readonly body: BodyPartType[]
  ) {
    this.bodyCost = _.sum(_.map(body, (part) => BODYPART_COST[part]));
  }

  public toString() {
    return `${this.type}(${this.body})`;
  }

  public sizedBody(size: number): BodyPartType[] {
    const body = [];
    for (const part of this.body) {
      for (let i = 0; i < size; i++) {
        body.push(part);
      }
    }
    return body;
  }
}

interface Population {
  [type: string]: number;
  TOTAL: number;
}

const creepTypes: BodyType[] = [
  new BodyType('mule', 2, 90, [MOVE, CARRY]),
  new BodyType('worker', 8, 100, [MOVE, MOVE, CARRY, WORK])
];

export function spawnCreeps(room: Room): void {
  const pop = countCreepsByType(room);
  log.debug(`${room} population: ${pop.TOTAL} creep(s)`);
  const missing = listMissingTypes(room, pop);
  if (missing.length > 0) {
    spawnMissingCreeps(room, missing, 1 + pop.TOTAL);
  }
}

function countCreepsByType(room: Room): Population {
  const pop: Population = {TOTAL: 0};
  for (const {type} of creepTypes) {
    pop[type] = 0;
  }
  for (const creep of room.creeps) {
    const type = creep.memory.type;
    if (!type || !(type in pop)) {
      creep.suicide();
      continue;
    }
    pop[type]++;
    pop.TOTAL++;
  }
  return pop;
}

function listMissingTypes(room: Room, pop: Population): BodyType[] {
  const numSpawns = room.find<Spawn>(FIND_MY_SPAWNS).length;
  const missing: BodyType[] = [];
  for (const {type, num, body, priority} of creepTypes) {
    const expected = numSpawns * num;
    for (let current = pop[type]; current < expected; current++) {
      missing.push(new BodyType(type, num, priority * (1.0 - current / expected), body));
    }
  }
  return missing;
}

function spawnMissingCreeps(room: Room, missing: BodyType[], maxSize: number): void {
  const spawnCapacity = getSpawnCapacity(room);
  const spawns = room.find<Spawn>(FIND_MY_SPAWNS, {filter: (s: Spawn) => s.isActive() && !s.spawning});
  log.debug(
    `${room}: ${missing.length} creep(s) to spawn, ${spawns.length} available spawn(s), ${spawnCapacity}`,
   `spawn capacity, ${maxSize} maximum size`
  );
  if (!spawns.length) {
    return;
  }

  missing.sort((a: BodyType, b: BodyType) => a.priority - b.priority);

  for (const spawn of spawns) {
    const current = missing.pop();
    if (!current) {
      break;
    }
    const size = Math.min(maxSize, Math.floor(spawnCapacity / current.bodyCost));
    if (!size) {
      log.debug(`${room}: not enough energy to spawn ${current}`);
      break;
    }
    const body = current.sizedBody(size);
    const result = spawn.createCreep(body, undefined, {type: current.type});
    if (typeof result !== 'string') {
      if (result !== ERR_NOT_ENOUGH_ENERGY) {
        log.debug(`${room}: cannot spawn ${current} creep of size ${size}: ${result}`);
      }
      break;
    }
    log.debug(`${room}: spawning ${current} creep of size ${size}: ${result}`);
  }
}

function getSpawnCapacity(room: Room) {
  return _.sum(
    _.map(
      room.find<Extension>(FIND_MY_STRUCTURES, {filter: (s: Structure & EnergyContainer) => (
        (s.structureType === 'spawn' || s.structureType === 'extension')
        && s.isActive()
      )}),
      (e: Extension) => e.energyCapacity
    )
  );
}
