
export interface Task {
  readonly type: string;
  priority: number;
  pos: RoomPosition;
  isSameAs(other: any): boolean;
  toString(): string;
}

export type Enqueue<T> = (t: T) => void;

export interface Manager<T extends Task> {
  readonly type: string;
  readonly requiredBodyParts: BodyPartType[];
  manage(room: Room, enqueue: Enqueue<T>): void;
  run(creep: Creep, task: T): void;
  isCompatible(creep: Creep): boolean;
}
