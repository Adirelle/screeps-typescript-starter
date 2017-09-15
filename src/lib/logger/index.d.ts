
declare namespace NodeJS {
  interface Global {
    log: Logger;
  }
}

interface Memory {
  log: any;
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
