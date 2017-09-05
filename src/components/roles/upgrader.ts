import {CreepPopulation, CreepRole, CreepFactory, BaseRole} from './role';
import { log } from "../../lib/logger/log";

export const factory: CreepFactory = new class {
    name = 'upgrader';
    bodyTemplate = [MOVE, WORK, CARRY];
    dependsOn = { 'mule': 0.5 };

    create(creep: Creep): CreepRole {
        return new Upgrader(creep);
    }

    targetPopulation(room: Room, pop: CreepPopulation): number {
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
    };

export class Upgrader extends BaseRole {
  public run(): void {
    const creep = this.creep;
    const target = creep.room.controller;
    if (!target) {
        return;
    }

    if (target.ticksToDowngrade > 3000 && target.level == 8) {
        return;
    }

    let result = creep.upgradeController(target)
    if (result == ERR_NOT_IN_RANGE) {
        result = creep.moveTo(target);
    }
    if (result !== OK && result !== ERR_NOT_ENOUGH_RESOURCES) {
        log.info(creep.name, target.pos.roomName, result);
    }
  }
}
