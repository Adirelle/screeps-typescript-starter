import { TargettedTask } from '../targetted';
import { TaskType } from '../task';

type Repairable = Structure & HitPoints;

class RepairTask extends TargettedTask<Repairable> {
  public readonly type = TaskType.REPAIR;

  public get priority() {
    return 100 * (this.target.hits / this.target.hitsMax);
  }

  public isValidTarget(target: Repairable) {
    return target.hits < target.hitsMax;
  }

  public isValidCreep(creep: Creep) {
    return creep.type.type === 'worker' && creep.energy > 0;
  }

  protected doCreepCompatibility(creep: Creep): number {
    return Math.pow(creep.energy / creep.carryCapacity, 2);
  }

  protected doRun() {
    return this.creep!.repair(this.target);
  }
}

const singleton = new RepairTask();

export function planRepairs(room: Room): RepairTask[] {
  return  _.map(
    _.filter(room.myActiveStructures, (s) => singleton.isValidTarget(s)),
    (s) => new RepairTask(undefined, s)
  );
}
