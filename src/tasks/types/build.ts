import { TargettedTask } from '../targetted';
import { TASK_BUILD } from '../task';

export class BuildTask extends TargettedTask<ConstructionSite> {

  public static plan(room: Room): BuildTask[] {
    return _.map(
      room.find<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES),
      (site) => new BuildTask(site)
    );
  }

  public get type() {
    return TASK_BUILD;
  }

  public get priority() {
    return 100 * Math.pow(this.target.progress / this.target.progressTotal, 2);
  }

  public isValidTarget(target: ConstructionSite): boolean {
    return target.progress < target.progressTotal;
  }

  public isValidCreep(creep: Creep): boolean {
    return creep.type.type === 'worker' && creep.energy > 0;
  }

  protected doCreepCompatibility(creep: Creep): number {
    return Math.pow(creep.energy / creep.carryCapacity, 2);
  }

  protected doRun(): ResultCode {
    return this.creep!.build(this.target);
  }
}
