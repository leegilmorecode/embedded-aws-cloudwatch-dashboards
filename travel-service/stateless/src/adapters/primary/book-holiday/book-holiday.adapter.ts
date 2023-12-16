import {
  MetricUnits,
  Metrics,
  logMetrics,
} from '@aws-lambda-powertools/metrics';
import { Tracer, captureLambdaHandler } from '@aws-lambda-powertools/tracer';
import { errorHandler, logger, randomError, schemaValidator } from '@shared';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { injectLambdaContext } from '@aws-lambda-powertools/logger';
import { config } from '@config';
import { BookHolidayDto } from '@dto/book-holiday';
import { ValidationError } from '@errors';
import middy from '@middy/core';
import { bookHolidayUseCase } from '@use-cases/book-holiday';
import { schema } from './book-holiday.schema';

const tracer = new Tracer({
  serviceName: config.get('service'),
});
const metrics = new Metrics({
  namespace: config.get('namespace'),
  serviceName: config.get('service'),
});

export const bookHolidayAdapter = async ({
  body,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('no payload body');

    const holiday = JSON.parse(body) as BookHolidayDto;

    // randomly throw a 'BookHolidayError' error for the purpose of the demo
    randomError();

    schemaValidator(schema, holiday);

    const created: BookHolidayDto = await bookHolidayUseCase(holiday);

    metrics.addMetric('SuccessfulHolidayBooking', MetricUnits.Count, 1);

    return {
      statusCode: 201,
      body: JSON.stringify(created),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('BookHolidayError', MetricUnits.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(bookHolidayAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
