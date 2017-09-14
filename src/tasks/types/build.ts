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
    switch (this.target.structureType) {
      case STRUCTURE_ROAD:
        const terrain = this.target.pos.lookFor<string>(LOOK_TERRAIN);
        return terrain[0] === 'swamp' ? 400 : 150;
      default:
        return 100;
    }
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

  protected targetToJSON(target: ConstructionSite): any {
    return target.id;
  }

  protected targetFromJSON(data: any): ConstructionSite {
    return Game.getObjectByIdOrDie<ConstructionSite>(data);
  }
}
