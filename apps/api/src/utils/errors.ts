import { ErrorCodes } from '@laps/shared';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly errors?: unknown[];

  constructor(
    statusCode: number,
    errorCode: string = ErrorCodes.INTERNAL_SERVER_ERROR,
    message: string,
    errors?: unknown[],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
