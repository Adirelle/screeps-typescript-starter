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
}

declare const __REVISION__: string
