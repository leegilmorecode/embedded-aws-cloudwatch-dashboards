import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

import { marshall } from '@aws-sdk/util-dynamodb';
import { config } from '@config';
import { BookHolidayDto } from '@dto/book-holiday';
import { logger } from '@shared';

const dynamoDb = new DynamoDBClient({});

export async function saveHoliday(
  bookHolidayDto: BookHolidayDto
): Promise<BookHolidayDto> {
  const tableName = config.get('tableName');

  const params = {
    TableName: tableName,
    Item: marshall(bookHolidayDto),
  };

  try {
    await dynamoDb.send(new PutItemCommand(params));

    logger.info(`Holiday booked with ${bookHolidayDto.id} into ${tableName}`);

    return bookHolidayDto;
  } catch (error) {
    console.error('error booking holiday:', error);
    throw error;
  }
}
