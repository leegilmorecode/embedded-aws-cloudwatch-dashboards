import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { CustomStack, DynamoDbTable } from '../custom-constructs';

import { Construct } from 'constructs';

export class TravelServiceStatefulStack extends CustomStack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // use our custom L3 construct which creates the table and the dashboard widget
    const { table, widget } = new DynamoDbTable(this, 'HolidaysTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      widgetTitle: 'DynamoDB Table Metrics',
      createWidget: true,
    });

    this.table = table;

    // add our widget to the stack
    this.addWidget(widget);
  }
}
