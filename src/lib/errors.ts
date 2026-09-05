export class ConflictError extends Error {
  statusCode = 409;
  constructor(message = "Conflict") { super(message); this.name = "ConflictError"; }
}
export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message = "Forbidden") { super(message); this.name = "ForbiddenError"; }
}
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = "Not Found") { super(message); this.name = "NotFoundError"; }
}
export class ValidationError extends Error {
  statusCode = 400;
  constructor(message = "Validation Error") { super(message); this.name = "ValidationError"; }
}