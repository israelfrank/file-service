/**
 * This file contains extended errors for the application.
 */

export class ApplicationError extends Error {
  public status: number;

  constructor(message?: string, status?: number) {
    super();

    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message || 'undefined Application Error';
    this.status = status || 500;
  }
}

export class ServerError extends ApplicationError {
  constructor(message?: string, status?: number) {
    super(message || 'internal Server Error', status || 500);
  }
}

export class ClientError extends ApplicationError {
  constructor(message?: string, status?: number) {
    super(message || 'client Side Error', status || 400);
  }
}
