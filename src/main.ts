import * as Config from './config/config';

import * as Profiler from 'screeps-profiler';
import { log } from './lib/logger/log';

import './augmentations';
import { managers, Task } from './tasks';

if (Config.USE_PROFILER) {
  Profiler.enable();
}

log.info('Scripts bootstrapped');

if (__REVISION__) {
  log.info(`Revision ID: ${__REVISION__}`);
}

function mloop(): void {
  cleanCreepMemory();
  _.each(Game.rooms, manageRoom);
  _.each(Game.creeps, (creep) => managers.run(creep));
}

function cleanCreepMemory() {
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      Memory.creeps[name] = undefined;
    }
  }
}

function manageRoom(room: Room) {
  const tasks = collectTasks(room);
  const creeps = room.find<Creep>(FIND_MY_CREEPS);
  const orders = assignTasks(tasks, creeps);
  runSpawns(room, orders);
}

function collectTasks(room: Room): Task[] {
  const tasks: Task[] = [];
  managers.manage(room, (t) => tasks.push(t));
  return tasks;
}

interface SpawnOrder {
  task: Task;
}

function assignTasks(tasks: Task[], creeps: Creep[]): SpawnOrder[] {
  const orders: SpawnOrder[] = [];
  tasks.sort((a: Task, b: Task) => a.priority - b.priority);
  _.each(tasks, (task) => {
    let creep: Creep|undefined;
    if (task.pos) {
      creep = task.pos.findClosestByPath<Creep>(creeps, {filter: (c: Creep) => c.canAssign(task)});
    } else {
      creep = _.find(creeps, (c) => c.canAssign(task));
    }
    if (creep)  {
      creep.assign(task);
    } else {
      orders.push({task});
    }
  });
  return orders;
}

function runSpawns(room: Room, orders: SpawnOrder[]): void {
  const spawns = room.find<StructureSpawn>(FIND_MY_SPAWNS);
}

/*
type BodyDef = BodyPartType[];

interface SpawnInfo {
  spawn: StructureSpawn;
  body: BodyDef;
  size: number;
}

function spawnCreeps(room: Room): void {
  const pop = countCreepsByRole(room);
  _.each(Roles.factories, (f: RoleFactory) => spawnRoleCreeps(room, f, pop));
}

function countCreepsByRole(room: Room): Population {
  const count: Population = {};
  _.each(Roles.factories, (f: RoleFactory) => (count[f.name] = 0));
  _.each(room.find<Creep>(FIND_MY_CREEPS), (c: Creep) => count[c.memory.role]++);
  return count;
}

function spawnRoleCreeps(room: Room, role: RoleFactory, pop: Population) {
  let target = role.targetPopulation(room, pop);
  const wish = target;
  let current = pop[role.name];
  const prev = current;

  if (role.dependsOn) {
    _.each(role.dependsOn, (factor: number, name: string) => {
      const limit = Math.ceil(pop[name] * factor);
      if (limit < target) {
        log.info(`${role.name} limited from ${target} to ${limit} by `);
        target = limit;
      }
    });
  }

  while (current < target && spawnCreep(room, role, role.bodyTemplate)) {
    current++;
  }

  log.info(`spawnRoleCreep ${role.name} ${prev}/${wish} => ${current}/${target}`);
}

function spawnCreep(room: Room, role: RoleFactory, bodyTpl: BodyDef) {
  const biggest = biggestBody(room, bodyTpl);
  if (biggest === null) {
    return null;
  }

  const creepName = biggest.spawn.createCreep(biggest.body);
  if (typeof creepName !== 'string') {
    log.warning(`Could not spawn ${role.name} in room ${room.name}: ${creepName}`);
    return null;
  }

  const creep = Game.creeps[creepName];
  creep.memory.role = role.name;
  log.info(`Spawning ${role.name} in room ${room.name}, name: ${creepName}, body: ${biggest.body}`);
  return creep;
}

function biggestBody(room: Room, bodyTpl: BodyDef): SpawnInfo|null {
  const allSpawns = room.find<StructureSpawn>(FIND_MY_STRUCTURES, {
    filter: (s: StructureSpawn) => s.structureType === STRUCTURE_SPAWN && !s.spawning
  });
  let size = 0;
  let body = null;
  let spawn = null;
  _.each(allSpawns, (testSpawn: StructureSpawn) => {
    let testSize = 1;
    do {
      const testBody = repeatBody(bodyTpl, testSize);
      const result = testSpawn.canCreateCreep(testBody);
      log.debug(`${testSpawn.name} ${testBody} => ${result}`);
      if (result !== OK) {
        break;
      }
      if (testSize > size) {
        spawn = testSpawn;
        size = testSize;
        body = testBody;
      }
      testSize++;
    } while (true);
  });
  log.debug(`biggestBody: ${bodyTpl} => ${size} ${body} ${spawn}`);
  if (spawn !== null && body !== null) {
    return { spawn, body, size };
  }
  return null;
}

function repeatBody(tpl: BodyDef, size: number) {
  const body: BodyDef = [];
  _.each(tpl, (part) => {
    for (let j = 0; j < size; j++) {
      body.push(part);
    }
  });
  return body;
}
*/

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export const loop = !Config.USE_PROFILER ? mloop : () => { Profiler.wrap(mloop); };
