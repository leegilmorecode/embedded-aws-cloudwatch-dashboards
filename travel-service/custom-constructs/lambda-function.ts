import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';

import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface LambdaFunctionProps
  extends Omit<
    nodeLambda.NodejsFunctionProps,
    | 'removalPolicy'
    | 'runtime'
    | 'memorySize'
    | 'timeout'
    | 'tracing'
    | 'handler'
    | 'bundling'
  > {
  /**
   * whether to create the widget or not
   */
  createWidget?: boolean;
  /**
   * The removal policy
   */
  removalPolicy: cdk.RemovalPolicy;
  /**
   * The The cloudwatch metric namespace
   */
  metricNamespace: string;
  /**
   * The cloudwatch metric name
   */
  metricName: string;
  /**
   * The cloudwatch filter name
   */
  filterName: string;
  /**
   * The cloudwatch filter pattern
   */
  metricFilterPattern: string;
  /**
   * The cloudwatch alarm name
   */
  alarmName: string;
  /**
   * The cloudwatch alarm description
   */
  alarmDescription: string;
  /**
   * The cloudwatch alarm description
   */
  topic: sns.Topic;
  /**
   * The cloudwatch metrics service name
   */
  metricsService: string;
  /**
   * The region
   */
  region: string;
  /**
   * The metric success name
   */
  metricSuccessName: string;
  /**
   * The metric success name title
   */
  metricSuccessNameTitle: string;
  /**
   * The metric error name
   */
  metricErrorName: string;
  /**
   * The metric error name title
   */
  metricErrorNameTitle: string;
}

export class LambdaFunction extends Construct {
  public readonly function: nodeLambda.NodejsFunction;
  public readonly widgets: cloudwatch.ConcreteWidget[] = [];
  public readonly metricFilter: logs.MetricFilter;
  public readonly alarm: cloudwatch.Alarm;

  constructor(scope: Construct, id: string, props: LambdaFunctionProps) {
    super(scope, id);

    const createWidget = props?.createWidget === true ? true : false;

    // these are our fixed props as an example only
    const fixedProps = {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      tracing: lambda.Tracing.ACTIVE,
      handler: 'handler',
      bundling: {
        minify: true,
        externalModules: [],
      },
    };

    this.function = new nodeLambda.NodejsFunction(this, id + 'Lambda', {
      // fixed props
      ...fixedProps,
      // custom props
      ...props,
    });

    // create the cloudwatch custom metric filter
    this.metricFilter = this.function.logGroup.addMetricFilter(id + 'Filter', {
      filterPattern: logs.FilterPattern.literal(props.metricFilterPattern),
      metricName: props.metricName,
      metricNamespace: props.metricNamespace,
      filterName: props.filterName,
    });

    // create the cloudwatch alarm
    this.alarm = new cloudwatch.Alarm(this, id + 'Alarm', {
      alarmName: props.alarmName,
      alarmDescription: props.alarmDescription,
      metric: this.metricFilter.metric(),
      threshold: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      actionsEnabled: true,
    });
    this.alarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    this.alarm.addAlarmAction(new SnsAction(props.topic));

    if (createWidget) {
      // create the widgets automatically that can be pushed to a dashboard
      this.widgets.push(
        ...[
          new cloudwatch.SingleValueWidget({
            title: props.metricSuccessNameTitle,
            metrics: [
              new cloudwatch.Metric({
                namespace: props.metricNamespace,
                metricName: props.metricSuccessName,
                label: props.metricSuccessName,
                region: props.region,
                dimensionsMap: {
                  service: props.metricsService,
                },
                statistic: cloudwatch.Stats.SUM,
                period: cdk.Duration.minutes(1),
              }),
            ],
          }),
          new cloudwatch.SingleValueWidget({
            title: props.metricErrorNameTitle,
            metrics: [
              new cloudwatch.Metric({
                namespace: props.metricNamespace,
                metricName: props.metricErrorName,
                label: props.metricErrorName,
                region: props.region,
                dimensionsMap: {
                  service: props.metricsService,
                },
                statistic: cloudwatch.Stats.SUM,
                period: cdk.Duration.minutes(1),
              }),
            ],
          }),
          new cloudwatch.AlarmStatusWidget({
            title: 'Alarms',
            alarms: [this.alarm],
          }),
        ]
      );
    }
  }
}
