import { planTasks } from './registry';
import { Task } from './task';

export function manageTasks(room: Room) {
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
      let distance = 0;
      if (task.pos) {
        const path = PathFinder.search(task.pos, creep.pos, {maxOps: 100});
        distance = Math.pow(path.cost / 5, 2);
      }
      const fitness = task.creepCompatibility(creep);
      const score = (fitness * task.priority) - distance;
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
