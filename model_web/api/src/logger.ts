import { Newable } from "inversify";
import { memoize } from "lodash";

export interface Logger {
  error(error: Error, ...others: any): void;
  info(...args: any[]): void;
  warn(...args: any[]): void;
}

export class DebugLogger implements Logger {
  private constructor(private readonly cls: Newable) {}
  error(error: Error, ...others: any): void {
    console.error(`Error:${this.cls.name}:`, error.message, ...others);
  }

  info(...args: any[]): void {
    console.log(`Info:${this.cls.name}:`, ...args);
  }

  warn(...args: any[]): void {
    console.warn(`Warn:${this.cls.name}:`, ...args);
  }

  static readonly getLogger = memoize((cls: Newable) => {
    return new DebugLogger(cls);
  });
}
