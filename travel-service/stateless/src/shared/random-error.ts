import { config } from '@config';
import { BookHolidayError } from '@errors';

const randomErrorBool = config.get('randomErrorBool') as string;

function stringToBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

export function randomError(): void {
  const randomCondition = Math.random() < 0.7;

  if (stringToBool(randomErrorBool) && randomCondition) {
    throw new BookHolidayError('Random error occurred!');
  }
}
