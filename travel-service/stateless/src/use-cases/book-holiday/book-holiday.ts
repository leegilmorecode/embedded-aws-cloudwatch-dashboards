import { getISOString, logger, schemaValidator } from '@shared';

import { saveHoliday } from '@adapters/secondary/database-adapter';
import { BookHolidayDto } from '@dto/book-holiday';
import { schema } from '@schemas/holiday';
import { v4 as uuid } from 'uuid';

export async function bookHolidayUseCase(
  holiday: BookHolidayDto
): Promise<BookHolidayDto> {
  const createdDate = getISOString();

  const holidayDto: BookHolidayDto = {
    id: uuid(),
    createdDate: createdDate,
    ...holiday,
  };

  schemaValidator(schema, holiday);

  // add your super duper business logic here

  await saveHoliday(holidayDto);

  logger.info(`holiday created with id: ${holidayDto.id}`);

  return holidayDto;
}
