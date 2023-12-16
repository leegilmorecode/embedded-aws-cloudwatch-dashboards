import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

interface DynamoDbTableProps
  extends Pick<dynamodb.TableProps, 'removalPolicy' | 'partitionKey'> {
  /**
   * whether to create the widget or not
   */
  createWidget?: boolean;
  /**
   * The partition key attribute for the table
   */
  partitionKey: dynamodb.Attribute;
  /**
   * The removal policy for the table
   */
  removalPolicy: cdk.RemovalPolicy;
  /**
   * The widget title
   */
  widgetTitle: string;
}

type FixedDynamoDbTableProps = Omit<
  dynamodb.TableProps,
  'removalPolicy' | 'partitionKey'
>;

export class DynamoDbTable extends Construct {
  public readonly table: dynamodb.Table;
  public readonly widget: cloudwatch.GraphWidget;

  constructor(scope: Construct, id: string, props: DynamoDbTableProps) {
    super(scope, id);

    const createWidget = props?.createWidget === true ? true : false;

    const fixedProps: FixedDynamoDbTableProps = {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      contributorInsightsEnabled: true,
    };

    this.table = new dynamodb.Table(this, id + 'Table', {
      // fixed props
      ...fixedProps,
      // custom props
      ...props,
    });

    if (createWidget) {
      // add the widget automatically
      this.widget = new cloudwatch.GraphWidget({
        title: props.widgetTitle,
        left: [this.table.metricConsumedWriteCapacityUnits()],
        right: [this.table.metricConsumedReadCapacityUnits()],
        statistic: cloudwatch.Stats.SUM,
        period: cdk.Duration.minutes(1),
      });
    }
  }
}
