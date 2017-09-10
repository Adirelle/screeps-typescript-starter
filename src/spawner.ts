import { log } from './lib/logger/log';

interface BodyType {
  type: string;
  num: number;
  priority: number;
  body: BodyPartType[];
}

interface Population {
  [type: string]: number;
}

const creepTypes: BodyType[] = [
  { type: 'mule', num: 2, body: [MOVE, CARRY], priority: 90 },
  { type: 'worker', num: 8, body: [MOVE, MOVE, CARRY, WORK], priority: 100 }
];

export function spawnCreeps(room: Room): void {
  const pop = countCreepsByType(room);
  const missing = listMissingTypes(room, pop);
  spawnMissingCreeps(room, missing);
}

function countCreepsByType(room: Room): Population {
  const pop: {[type: string]: number} = {};
  for (const {type} of creepTypes) {
    pop[type] = 0;
  }

  for (const creep of room.creeps) {
    const type = creep.memory.type;
    if (type) {
      pop[type]++;
    }
  }

  return pop;
}

function listMissingTypes(room: Room, pop: Population): BodyType[] {
  const numSpawns = room.find<Spawn>(FIND_MY_SPAWNS).length;
  const missing: BodyType[] = [];
  for (const {type, num, body, priority} of creepTypes) {
    const expected = numSpawns * num;
    for (let current = pop[type]; current < expected; current++) {
      missing.push({type, num, body, priority: priority * (1.0 - current / expected) });
    }
  }
  return missing;
}

function spawnMissingCreeps(room: Room, missing: BodyType[]): void {
  missing.sort((a: BodyType, b: BodyType) => a.priority - b.priority);
  const spawns = room.find<Spawn>(FIND_MY_SPAWNS, {filter: (s: Spawn) => !s.spawning});
  for (const {body, type} of missing) {
    while (spawns.length > 0) {
      const spawn = spawns.shift() as Spawn;
      const result = spawn.createCreep(body, undefined, {type});
      if (typeof result === 'string') {
        log.info(`${spawn} spawns a new ${type} creep: ${result}`);
        break;
      }
      log.debug(`${spawn} cannot spawn ${type} creep: ${result}`);
    }
    if (!spawns.length) {
      break;
    }
  }
}
