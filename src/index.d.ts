// add objects to `global` here
declare namespace NodeJS {
  interface Global {
    log: any;
  }
}

interface Memory {
  log: any;
}

interface Creep {
  readonly energy: number;
  readonly payload: number;
  isFull(): boolean;
  isEmpty(): boolean;
}

interface Room {
  readonly creeps: Creep[];
  toString(): string;
}

interface RoomPosition {
  toString(): string;
}

interface Structure {
  toString(): string;
}

declare const __REVISION__: string
