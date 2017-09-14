import './augmentations';

import * as Profiler from 'screeps-profiler';

import * as Config from './config/config';
import { log } from './lib/logger/log';
import { spawnCreeps } from './spawner';
import { planTasks, Task } from './tasks';

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
      log.error('During task run:', creep, creep.task, ex);
      creep.stopTask();
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
    log.error('during spawnCreeps', room, ex);
  }
  try {
    manageTasks(room);
  } catch (ex) {
    log.error('during manageTasks', room, ex);
  }
  try {
    const names = _.map(room.myCreeps, 'name');
    names.sort();
    _.each(names, (name: string, i: number) => {
      const creep = Game.creeps[name];
      room.visual.text(`${name}(${creep.type.type}): ${creep.task}`, 0, 49 - i, {align: 'left'});
    });
  } catch (ex) {
    log.error('during displayTasks', room, ex);
  }
}

function manageTasks(room: Room) {
  const [idleCreeps, busyCreeps] = _.partition(room.myCreeps, (c) => c.isIdle());
  room.visual.text(
    `Work: ${busyCreeps.length} busy / ${idleCreeps.length} idle`,
    49, 49,  {align: 'right', opacity: 0.5}
  );
  if (!idleCreeps.length) {
    return;
  }
  const tasks = planTasks(room);
  removeAssignedTasks(tasks, busyCreeps);
  log.debug(room, tasks.length, 'unassigned tasks');
  if (!tasks.length) {
    return;
  }
  assignTasks(idleCreeps, tasks);
}

function removeAssignedTasks(tasks: Task[], creeps: Creep[]) {
  _.remove(tasks, (t) => _.any(creeps, (c) => c.task && t.isSameAs(c.task)));
}

interface ScoredTask {
  task: Task;
  score: number;
}

function assignTasks(creeps: Creep[], tasks: Task[]): void {
  const toAssign: { [name: string]: ScoredTask } = {};
  _.each(creeps, (creep) => {
    const name = creep.name;
    _.each(tasks, (task) => {
      if (!task.isValidCreep(creep)) {
        return;
      }
      const fitness = task.creepCompatibility(creep);
      const range = task.pos ? Math.pow(task.pos.getRangeTo(creep.pos) / 70, 2) : 0.0;
      const score = fitness * task.priority * (1.0 - range);
      // log.debug(`creep=${name} task=${task} priority=${task.priority} fitness=${fitness} range=${range} score=${score}`);
      if (fitness > 0 && (!toAssign[name] || toAssign[name].score < score)) {
        toAssign[name] = { task, score };
      }
    });
  });

  _.each(toAssign, ({ task, score }, name) => {
    const creep = Game.creeps[name!];
    creep.task = task;
    creep.say(`${task.type}ing!`);
    log.info(`${creep.room}: assigned ${task} to ${creep} (priority=${task.priority} score=${score})`);
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
