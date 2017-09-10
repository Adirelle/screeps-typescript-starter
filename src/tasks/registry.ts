import { log } from '../lib/logger/log';
import { Enqueue, Manager, Task } from './task';

class ManagerRegistry {
  public readonly type = 'registry';
  public readonly requiredBodyParts = [];

  private managers: { [type: string]: Manager<any> } = {};

  public register<T extends Task>(manager: Manager<T>): void {
    if (this.managers[manager.type]) {
      return;
    }
    this.managers[manager.type] = manager;
    log.debug(`Registered ${manager.type} manager`);
  }

  public manage<T extends Task>(room: Room, enqueue: Enqueue<T>): void {
    _.each(this.managers, (manager) => manager.manage(room, enqueue));
  }

  public run(creep: Creep): void {
    if (!creep.task || creep.spawning) {
      return;
    }
    this.getManager(creep.task).run(creep, creep.task);
  }

  public getManager(task: Task|string): Manager<any> {
    const type = typeof task === 'string' ? task : task.type;
    if (!this.managers[type]) {
      throw new Error(`Unknown task type ${type}`);
    }
    return this.managers[type];
  }

  public isCompatible(creep: Creep, task: Task|string) {
    const manager = this.getManager(task);
    return manager.isCompatible(creep) && creep.hasBodyParts(manager.requiredBodyParts);
  }
}

export const registry = new ManagerRegistry();
export default registry;
