import { TargettedTask } from '../targetted';
import { getObjectByIdOrDie, TASK_PICKUP } from '../task';

export class PickupTask extends TargettedTask<Resource> {

  public static plan(room: Room): PickupTask[] {
    return _.map(
      room.find<Resource>(FIND_DROPPED_RESOURCES),
      (r) => new PickupTask(r)
    );
  }

  public get type() {
    return TASK_PICKUP;
  }

  public isValidTarget(_target: Resource) {
    return true;
  }

  public isValidCreep(creep: Creep) {
    return !creep.isFull();
  }

  public get priority() {
    return 100.0;
  }

  protected doRun() {
    return this.creep!.pickup(this.target);
  }

  protected doCreepCompatibility(creep: Creep) {
    return (creep.type.type === 'mule' ? 1.0 : 0.5) * (1.0 - Math.pow(creep.payload / creep.carryCapacity, 2));
  }

  protected targetToJSON(target: Resource): any {
    return target.id;
  }

  protected targetFromJSON(data: any): Resource {
    return getObjectByIdOrDie<Resource>(data);
  }
}
