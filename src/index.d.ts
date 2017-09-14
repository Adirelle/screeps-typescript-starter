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

declare const enum LogLevels {
  ERROR,
  WARNING,
  INFO,
  DEBUG
}

interface Logger {
  level: LogLevels;
  showSource: boolean;
  showTick: boolean;

  trace(error: Error): Logger;

  error(...args: any[]): void;
  warning(...args: any[]): void;
  info(...args: any[]): void;
  debug(...args: any[]): void;
}

declare const log: Logger;

declare const __REVISION__: string;
declare const __BUILD_TIME__: string;
declare const __ENV__: string;
declare const PRODUCTION: boolean;
