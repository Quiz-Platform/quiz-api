export interface eventLog {
  type: 'event';
  message: string;
}

export interface errorLog {
  type: 'error';
  message: string;
  error?: Error | unknown;
}

export type LogRecord = eventLog | errorLog;

export class Logger {
  public log(record: LogRecord): void {
    if (record.type === 'event') {
      this.logEvent(record.message);
    } else {
      this.logError(record.message, record.error);
    }
  }

  public logEvent(message: string): void {
    console.info(`[EVENT]: ${message}`);
  }

  public logError(message: string, error: Error | unknown): void {
    console.error(`[ERROR]: ${message}`, error ? error : '');
  }
}

