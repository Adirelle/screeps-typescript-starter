import { registerSerializer, Serializer } from '../../lib/serializer';
import managers from '../registry';
import { TargettedTask } from '../targetted';
import { BaseManager, Enqueue } from '../task';

const UPGRADE_TASK = 'upgrade';

class UpgradeTask extends TargettedTask<Controller> {
  public readonly type = UPGRADE_TASK;

  public constructor(target: Controller, public priority: number) {
    super(target);
  }
}

class UpgradeTaskManager extends BaseManager<UpgradeTask> {
  public readonly type =  UPGRADE_TASK;

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

  public run(creep: Creep, {target}: UpgradeTask) {
    this.doOrMoveOrStop(creep.upgradeController(target), target, creep);
  }
}

interface SerializedUpgradeTask {
  type: 'upgrade';
  targetId: string;
  priority: number;
}

class UpgradeTaskSerializer implements Serializer<UpgradeTask, SerializedUpgradeTask> {
  public readonly type = UPGRADE_TASK;

  public serialize({target, priority}: UpgradeTask): SerializedUpgradeTask {
    return {type: UPGRADE_TASK, targetId: target.id, priority};
  }
  public unserialize({targetId, priority}: SerializedUpgradeTask): UpgradeTask {
    const controller = Game.getObjectById<Controller>(targetId);
    if (!controller) {
      throw new Error(`Unknown controller ${targetId}`);
    }
    return new UpgradeTask(controller, priority);
  }
}

managers.register(new UpgradeTaskManager());
registerSerializer(new UpgradeTaskSerializer());
