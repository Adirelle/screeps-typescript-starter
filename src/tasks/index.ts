import { iterate } from './state_machine';
import { resetTasks } from './tasks';

export function manageTasks(room: Room) {
  resetTasks(room);
  for (const c of room.myCreeps) {
    for (let i = 0; i < 3; i++) {
      try {
        if (!iterate(c)) {
          break;
        }
      } catch (ex) {
        log.error(`Error while managing ${c}`);
        log.trace(ex);
        c.memory.state = 'default';
        delete c.memory.value;
      }
    }
  }
}
