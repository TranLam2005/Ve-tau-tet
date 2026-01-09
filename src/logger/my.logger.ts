import { LoggerService, LogLevel } from '@nestjs/common';

export class MyLogger implements LoggerService {
  log(message: string, context?: string) {
    console.log(`***LOG*** [${context}] | `, message);
  }
  error(message: string, context?: string) {
    console.log(`***ERROR*** [${context}] | `, message);
  }
  warn(message: string, context?: string) {
    console.log(`***WARN*** [${context}] | `, message);
  }
  debug?(message: string, context?: string) {
    console.log(`***DEBUG*** [${context}] | `, message);
  }
  verbose?(message: string, context?: string) {
    console.log(`***VERBOSE*** [${context}] | `, message);
  }
  fatal?(message: string, context?: string) {
    console.log(`***FATAL*** [${context}] | `, message);
  }
  setLogLevels?(levels: LogLevel[]) {
    throw new Error('Method not implemented.');
  }
}
