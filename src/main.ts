import './augmentations';
import './lib/logger';

import * as Profiler from 'screeps-profiler';

import * as Config from './config/config';
import { manageLinks } from './linkManager';
import { spawnCreeps } from './spawner';
import { manageTasks } from './taskManager';
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

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export const loop = !Config.USE_PROFILER ? mloop : () => { Profiler.wrap(mloop); };
