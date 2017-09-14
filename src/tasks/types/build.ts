import { TargettedTask } from '../targetted';
import { getObjectByIdOrDie, TASK_BUILD } from '../task';

export const StructurePriority: { [type: string]: number } = {
  [STRUCTURE_TOWER]: 600,
  [STRUCTURE_RAMPART]: 500,
  [STRUCTURE_WALL]: 500,
  [STRUCTURE_SPAWN]: 400,
  [STRUCTURE_EXTENSION]: 200,
  [STRUCTURE_ROAD]: 150
  // [STRUCTURE_LINK]: 100,
  // [STRUCTURE_STORAGE]: 100,
  // [STRUCTURE_OBSERVER]: 100,
  // [STRUCTURE_POWER_BANK]: 100,
  // [STRUCTURE_POWER_SPAWN]: 100,
  // [STRUCTURE_EXTRACTOR]: 100,
  // [STRUCTURE_LAB]: 100,
  // [STRUCTURE_TERMINAL]: 100,
  // [STRUCTURE_CONTAINER]: 100,
  // [STRUCTURE_NUKER]: 100,
  // [STRUCTURE_PORTAL]: 100
};

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
    let prio = StructurePriority[this.target.structureType] || 100;
    if (this.target.structureType === STRUCTURE_ROAD) {
      prio += 300;
    }
    return prio;
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
    return getObjectByIdOrDie<ConstructionSite>(data);
  }
}
