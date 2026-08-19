export class SafeFailure extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "SafeFailure";
    this.code = code;
    this.details = Object.freeze({ ...details });
  }
}
