import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { Enqueue, Manager, Task } from '../task';

const UPGRADE_TASK = 'upgrade';

class UpgradeTask implements Task {
  public readonly type = UPGRADE_TASK;

  public constructor(public controller: Controller) {
  }

  public get priority(): number {
    return Math.max(0, Math.ceil((5000 - this.controller.ticksToDowngrade) / 100));
  }

  public toString() {
    return `upgrade(${this.controller.room.name}, ${this.priority})`;
  }

  public isSameAs(other: any) {
    return other instanceof UpgradeTask && other.controller.id === this.controller.id;
  }
}

class UpgradeTaskManager implements Manager<UpgradeTask> {
  public readonly type =  UPGRADE_TASK;
  public readonly requiredBodyParts = [WORK, CARRY, MOVE];

  public manage(room: Room, enqueue: Enqueue<UpgradeTask>) {
    if (room.controller) {
      enqueue(new UpgradeTask(room.controller));
    }
  }

  public run(creep: Creep, {controller}: UpgradeTask) {
    let result = creep.upgradeController(controller);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(controller);
    }
    if (result === ERR_NOT_ENOUGH_ENERGY) {
      creep.task = null;
    }
  }

  public isCompatible(creep: Creep) {
    return creep.energy > 0;
  }
}

interface SerializedUpgradeTask {
  type: 'upgrade';
  controllerId: string;
}

class UpgradeTaskSerializer implements Serializer<UpgradeTask, SerializedUpgradeTask> {
  public readonly type = UPGRADE_TASK;

  public serialize({controller}: UpgradeTask): SerializedUpgradeTask {
    return {type: UPGRADE_TASK, controllerId: controller.id};
  }
  public unserialize({controllerId}: SerializedUpgradeTask): UpgradeTask {
    const controller = Game.getObjectById<Controller>(controllerId);
    if (!controller) {
      throw new Error(`Unknown controller ${controllerId}`);
    }
    return new UpgradeTask(controller);
  }
}

managers.register(new UpgradeTaskManager());
registerSerializer(new UpgradeTaskSerializer());
