import { TargettedTask } from '../targetted';
import { getObjectByIdOrDie, TASK_REPAIR } from '../task';
import { StructurePriority } from './build';

type Repairable = Structure & HitPoints;

function isValidTarget(target: Repairable) {
  return target.hits < target.hitsMax;
}

export class RepairTask extends TargettedTask<Repairable> {

  public static plan(room: Room): RepairTask[] {
    return  _.map(
      _.filter(room.myActiveStructures, isValidTarget),
      (s) => new RepairTask(s)
    );
  }

  public get type() {
    return TASK_REPAIR;
  }

  public get priority() {
    return (100 + (StructurePriority[this.target.structureType] || 100)) * (1.0 - this.target.hits / this.target.hitsMax);
  }

  public isValidTarget(target: Repairable) {
    return isValidTarget(target);
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

  protected targetToJSON(target: Repairable) {
    return target.id;
  }

  protected targetFromJSON(id: any) {
    return getObjectByIdOrDie<Repairable>(id);
  }
}
