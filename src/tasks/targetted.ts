import { Serializer } from './../lib/serializer';
import { BaseTask } from './task';

interface TaskTarget {
  id: string;
  pos: RoomPosition;
}

export abstract class TargettedTask<T extends TaskTarget> extends BaseTask {
  constructor(public readonly target: T) {
    super();
  }

  public get pos() {
    return this.target.pos;
  }

  public toString() {
    return `${this.type}(${this.target},${this.priority})`;
  }
}

export interface SerializedTargettedTask {
  type: string;
  targetId: string;
}

export abstract class TargettedTaskSerializer<T extends TaskTarget>
  implements Serializer<TargettedTask<T>, SerializedTargettedTask> {

  public serialize({target}: TargettedTask<T>): SerializedTargettedTask {
    return {type: this.type, targetId: target.id};
  }

  public unserialize(u: SerializedTargettedTask): TargettedTask<T> {
    const target = Game.getObjectById<T>(u.targetId);
    if (!target) {
      throw new Error(`Unknown object ${u.targetId}`);
    }
    return this.buildTask(target, u);
  }

  public abstract get type(): string;

  protected abstract buildTask(target: T, u: SerializedTargettedTask): TargettedTask<T>;
}
