import './augmentations';
import './lib/logger';

import * as Profiler from 'screeps-profiler';

import * as Config from './config/config';
import { manageLinks } from './linkManager';
import { spawnCreeps } from './spawner';
import { manageTasks } from './tasks';
import { manageTowers } from './towerManager';

log.info('Scripts bootstrapped');

if (Config.USE_PROFILER) {
  Profiler.enable();
  log.debug('Profiler enabled');
}

function mloop(): void {
  log.debug(`========== Tick #${Game.time} (${__ENV__}-${__REVISION__}, ${__BUILD_TIME__}) ==========`);
  cleanCreepMemory();
  _.each(Game.rooms, manageRoom);
  _.each(Game.creeps, (creep) => {
    try {
      creep.task.run();
    } catch (ex) {
      creep.stopTask(`error ${ex}`);
    }
  });
}

function cleanCreepMemory() {
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      delete Memory.creeps[name];
    }
  }
}

function manageRoom(room: Room) {
  try {
    spawnCreeps(room);
  } catch (ex) {
    log.error('during spawnCreeps');
    log.trace(ex);
  }
  try {
    manageTasks(room);
  } catch (ex) {
    log.error('during manageTasks');
    log.trace(ex);
  }
  try {
    manageTowers(room);
  } catch (ex) {
    log.error('during manageTowers');
    log.trace(ex);
  }
  try {
    manageLinks(room);
  } catch (ex) {
    log.error('during manageLinks');
    log.trace(ex);
  }
}

function displayTasks(room: Room) {
  const names = _.map(room.myCreeps, 'name');
  names.sort();
  _.each(names, (name: string, i: number) => {
    const creep = Game.creeps[name];
    room.visual.text(`${name}(${creep.type.type}): ${creep.task}`, 0, 49 - i, {
      align: 'left',
      color: creep.color,
      size: 0.6
    });
  });
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
