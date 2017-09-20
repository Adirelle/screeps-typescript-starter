import { iterate } from './state_machine';
import { resetTasks } from './tasks';

export function manageTasks(room: Room) {
  resetTasks(room);
  for (const c of room.myCreeps) {
    for (let i = 0; iterate(c) && i < 3; i++) {
      // spin
    }
  }
}
