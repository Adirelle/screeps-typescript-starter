import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { Enqueue, Manager, Task } from '../task';

const UPGRADE_TASK = 'upgrade';

class UpgradeTask implements Task {
  public readonly type = UPGRADE_TASK;

  public constructor(
    public controller: Controller,
    public priority: number
  ) {}

  public get pos() {
    return this.controller.pos;
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
    const ctrl = room.controller;
    if (!ctrl) {
      return;
    }
    if (ctrl.ticksToDowngrade < 5000) {
      enqueue(new UpgradeTask(ctrl, 5000 - ctrl.ticksToDowngrade));
    }
    for (let p = ctrl.level * 150; p >= 100; p /= 2.0) {
      enqueue(new UpgradeTask(ctrl, p));
    }
  }

  public run(creep: Creep, {controller}: UpgradeTask) {
    if (!creep.energy) {
      creep.stopTask();
      return;
    }
    let result = creep.upgradeController(controller);
    if (result === ERR_NOT_IN_RANGE) {
      result = creep.moveTo(controller);
    }
    if (result !== OK && result !== ERR_TIRED) {
      creep.stopTask();
    }
  }

  public isCompatible(creep: Creep) {
    return creep.energy > 0;
  }
}

interface SerializedUpgradeTask {
  type: 'upgrade';
  controllerId: string;
  priority: number;
}

class UpgradeTaskSerializer implements Serializer<UpgradeTask, SerializedUpgradeTask> {
  public readonly type = UPGRADE_TASK;

  public serialize({controller, priority}: UpgradeTask): SerializedUpgradeTask {
    return {type: UPGRADE_TASK, controllerId: controller.id, priority};
  }
  public unserialize({controllerId, priority}: SerializedUpgradeTask): UpgradeTask {
    const controller = Game.getObjectById<Controller>(controllerId);
    if (!controller) {
      throw new Error(`Unknown controller ${controllerId}`);
    }
    return new UpgradeTask(controller, priority);
  }
}

managers.register(new UpgradeTaskManager());
registerSerializer(new UpgradeTaskSerializer());
