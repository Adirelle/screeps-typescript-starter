import { log } from '../../lib/logger/log';
import { BaseRole, Factory, Population, Role } from './role';

export const factory: Factory = new class {
  public name = 'upgrader';
  public bodyTemplate = [MOVE, WORK, CARRY];
  public dependsOn = { mule: 0.5 };

  public create(creep: Creep): Role {
    return new Upgrader(creep);
  }

  public targetPopulation(room: Room, _pop: Population): number {
    if (!room.controller) {
      return 0;
    }
    if (room.controller.level < 8) {
      return 3;
    }
    if (room.controller.ticksToDowngrade < 4000) {
      return 1;
    }
    return 0;
  }
}();

export class Upgrader extends BaseRole {
  public run(): void {
    const target = this.creep.room.controller;
    if (!target) {
      return;
    }

    if (target.ticksToDowngrade > 3000 && target.level === 8) {
      return;
    }

    let result = this.creep.upgradeController(target);
    if (result === ERR_NOT_IN_RANGE) {
      result = this.creep.moveTo(target);
    }
    if (result !== OK && result !== ERR_NOT_ENOUGH_RESOURCES) {
      log.info(this.creep.name, target.pos.roomName, result);
    }
  }
}
