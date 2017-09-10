import './augmentations';

import * as Profiler from 'screeps-profiler';

import * as Config from './config/config';
import { log } from './lib/logger/log';
import { spawnCreeps } from './spawner';
import { managers, Task } from './tasks';

if (Config.USE_PROFILER) {
  Profiler.enable();
  log.debug('Profiler enabled');
}

log.info('Scripts bootstrapped');

if (__REVISION__) {
  log.info(`Revision ID: ${__REVISION__}`);
}

function mloop(): void {
  log.info(`=== Tick #${Game.time} ===`);
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
  spawnCreeps(room);
  const tasks = collectTasks(room);
  if (tasks.length) {
    assignTasks(room.myCreeps, tasks);
  }
}

function collectTasks(room: Room): Task[] {
  const tasks: Task[] = [];
  managers.manage(room, (t: Task) => tasks.push(t));
  return tasks;
}

function assignTasks(creeps: Creep[], tasks: Task[]): void {
  tasks.sort((a: Task, b: Task) => b.priority - a.priority);
  log.debug(tasks.length, 'task(s)', creeps.length, 'creep(s)');

  for (const task of tasks) {
    const debug = ((...args: any[]) => log.debug(Game.cpu.getUsed(), creeps.length, task.priority, ...args));
    let i = _.findIndex(creeps, (c) => task.isSameAs(c.task));
    if (i < 0) {
      const potentials = _.filter(creeps, (c: Creep) => c.canAssign(task));
      const creep = task.pos.findClosestByPath<Creep>(potentials);
      if (!creep) {
        debug(task, 'cannot assign');
        continue;
      }
      creep.assign(task);
      debug(task, 'assigned to', creep);
      i = creeps.indexOf(creep);
    } else {
      debug(task, 'already assigned to', creeps[i]);
    }
    creeps.splice(i, 1);
    if (!creeps.length) {
      break;
    }
  }
}

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export const loop = !Config.USE_PROFILER ? mloop : () => { Profiler.wrap(mloop); };
