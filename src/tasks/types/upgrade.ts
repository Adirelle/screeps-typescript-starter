import { TargettedTask } from '../targetted';
import { TaskType } from '../task';

export class UpgradeTask extends TargettedTask<Controller> {
  public readonly type = TaskType.UPGRADE;

  public get priority() {
    if (this.target.ticksToDowngrade < 5000) {
      return 1500 - (this.target.ticksToDowngrade / 10);
    }
    return this.target.level * 25;
  }

  public isValidTarget(target: Controller) {
    return target.my && (target.level < 8 || target.ticksToDowngrade < 5000);
  }

  public isValidCreep(creep: Creep) {
    return creep.type.type === 'worker' && creep.energy > 0;
  }

  protected doCreepCompatibility(creep: Creep): number {
    return Math.pow(creep.energy / creep.carryCapacity, 2);
  }

  protected doRun() {
    return this.creep!.upgradeController(this.target);
  }
}

export function planUpgrades(room: Room): UpgradeTask[] {
  const ctrl = room.controller;
  return ctrl ? [new UpgradeTask(undefined, ctrl)] : [];
}
