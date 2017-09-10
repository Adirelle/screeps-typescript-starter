import { Serializer } from './../lib/serializer';
import { Task } from './task';

interface TaskTarget {
  id: string;
  pos: RoomPosition;
}

export abstract class TargettedTask<T extends TaskTarget> implements Task {
  constructor(public readonly target: T) {}

  public get pos() {
    return this.target.pos;
  }

  public isSameAs(other: any): boolean {
    return (
      other instanceof TargettedTask
      && other.type === this.type
      && other.target.id === this.target.id
    );
  }

  public toString(): string {
    return `${this.type}(${this.target},${this.priority})`;
  }

  public abstract get type(): string;

  public abstract get priority(): number;
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
