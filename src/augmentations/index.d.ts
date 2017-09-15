
interface Creep extends EnergyContainer {
  readonly color: string;
  readonly payload: number;
  isEmpty(): boolean;
  isFull(): boolean;
}

interface Room {
  readonly myCreeps: Creep[];
  readonly myStructures: Structure[];
  readonly myActiveStructures: Structure[];
  toString(): string;
}

interface RoomPosition {
  toString(): string;
}

interface Structure {
  toString(): string;
}
