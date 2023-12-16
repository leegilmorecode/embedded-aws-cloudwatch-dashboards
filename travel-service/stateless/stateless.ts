import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as path from 'path';

import { Api, CustomStack, LambdaFunction } from '../custom-constructs';

import { Construct } from 'constructs';
import { CustomStackProps } from 'custom-constructs/custom-stack';
import { config } from '../stateless/src/config';

export interface StatelessStackProps extends CustomStackProps {
  table: dynamodb.Table;
}

export class TravelServiceStatelessStack extends CustomStack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: StatelessStackProps) {
    super(scope, id, props);

    this.table = props.table;

    // get all of the configuration values
    const { email, namespace, service, region, randomErrorBool } =
      config.getProperties();

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'enabled',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'captureHTTPsRequests',
      POWERTOOLS_SERVICE_NAME: service,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'captureResult',
      POWERTOOLS_METRICS_NAMESPACE: namespace,
    };

    // create our sns topic for our alarm
    const topic = new sns.Topic(this, 'AlarmTopic', {
      displayName: 'ErrorAlarmTopic',
      topicName: 'ErrorAlarmTopic',
    });

    // create a lambda function with our custom construct which
    // also creates the dashboard widgets for us automatically
    const {
      function: bookHolidayLambda,
      widgets: bookHolidayLambdaAlarmWidgets,
    } = new LambdaFunction(this, 'BookHolidayLambda', {
      entry: path.join(
        __dirname,
        'src/adapters/primary/book-holiday/book-holiday.adapter.ts'
      ),
      environment: {
        RANDOM_ERROR: randomErrorBool,
        TABLE_NAME: this.table.tableName,
        ...lambdaPowerToolsConfig,
      },
      topic,
      region,
      createWidget: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      alarmName: 'BookHolidayErrorAlarm',
      alarmDescription: 'Book Holiday Error Alarm',
      metricName: 'BookHolidayError',
      metricNamespace: namespace,
      metricsService: service,
      metricErrorName: 'BookHolidayError',
      metricErrorNameTitle: 'Book Holiday Errors',
      metricSuccessName: 'SuccessfulHolidayBooking',
      metricSuccessNameTitle: 'Successful Holiday Bookings',
      metricFilterPattern:
        '{ $.statusCode = 400 && $.errorName = "BookHolidayError" }',
      filterName: 'BookHolidayErrorMetricFilter',
    });
    this.addWidgets(bookHolidayLambdaAlarmWidgets);

    // grant the lambda write access to the table
    this.table.grantWriteData(bookHolidayLambda);

    // add the email subscription for our alarms so we are alerted
    topic.addSubscription(new snsSubs.EmailSubscription(email));

    // create our rest api using our custom construct which also creates are widgets
    const { api, widgets: ApiWidgets } = new Api(this, 'HolidaysApi', {
      description: 'Holidays API',
      widgetTitle: 'Travel API Metrics',
      deploy: true,
      createWidget: true,
    });
    this.addWidgets(ApiWidgets);

    // add our routes and integrations to the api
    const holidays: apigw.Resource = api.root.addResource('holidays');
    holidays.addMethod(
      'POST',
      new apigw.LambdaIntegration(bookHolidayLambda, {
        proxy: true,
      })
    );
  }
}
