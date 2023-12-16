export class BookHolidayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookHolidayError';
  }
}
