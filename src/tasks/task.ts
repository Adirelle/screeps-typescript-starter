
export interface Task {
  readonly type: string;
  priority: number;
  pos?: RoomPosition;
  toString(): string;
}

export type Enqueue = (t: Task) => void;

export interface Manager {
  readonly type: string;
  readonly requiredBodyParts: BodyPartType[];
  manage(room: Room, enqueue: Enqueue): void;
  run(creep: Creep): void;
  isCompatible(creep: Creep): boolean;
}
