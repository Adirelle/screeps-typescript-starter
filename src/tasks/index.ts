import { iterate } from './state_machine';
import { assignTasks, resetTasks } from './tasks';

export function manageTasks(room: Room) {
  resetTasks(room);
  const creeps = room.myCreeps;
  for (let i = 2; creeps.length > 0 && i > 0; i--) {
    assignTasks();
    _.remove(creeps, (c) => {
      try {
        return !iterate(c);
      } catch (ex) {
        log.error(`Error while managing ${c}`);
        log.trace(ex);
        c.memory.state = 'default';
        delete c.memory.value;
        return false;
      }
    });
  }
}
