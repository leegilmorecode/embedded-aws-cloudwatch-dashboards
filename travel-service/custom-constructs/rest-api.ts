import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import { Duration, RemovalPolicy } from 'aws-cdk-lib';

import { Construct } from 'constructs';

interface ApiProps extends Pick<apigw.RestApiProps, 'description' | 'deploy'> {
  /**
   * whether to create the widget or not
   */
  createWidget?: boolean;
  /**
   * Whether or not to deploy the api
   */
  deploy?: boolean;
  /**
   * The stage name which the api is being used with
   */
  stageName?: string;
  /**
   * The api description
   */
  description: string;
  /**
   * The dashboard widget description
   */
  widgetTitle: string;
}

type FixedApiProps = Omit<apigw.RestApiProps, 'description' | 'deploy'>;

export class Api extends Construct {
  public readonly api: apigw.RestApi;
  public readonly widgets: cloudwatch.GraphWidget[] = [];

  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const createWidget = props?.createWidget === true ? true : false;

    const fixedProps: FixedApiProps = {
      defaultCorsPreflightOptions: {
        allowOrigins: apigw.Cors.ALL_ORIGINS,
        allowCredentials: true,
        allowMethods: ['OPTIONS', 'POST', 'GET'],
        allowHeaders: ['*'],
      },
      endpointTypes: [apigw.EndpointType.REGIONAL],
      cloudWatchRole: true,
      deployOptions: {
        stageName: props.stageName ? props.stageName : 'prod',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    };

    this.api = new apigw.RestApi(this, id + 'RestApi', {
      // fixed props
      ...fixedProps,
      // custom props
      description: props.description
        ? props.description
        : `${props.stageName} API`,
      deploy: props.deploy ? props.deploy : true,
    });

    this.api.applyRemovalPolicy(RemovalPolicy.DESTROY);

    if (createWidget) {
      // add the cloudwatch widget
      this.widgets.push(
        new cloudwatch.GraphWidget({
          title: `${props.widgetTitle} Client Errors`,
          left: [this.api.metricCount()],
          right: [this.api.metricClientError()],
          statistic: cloudwatch.Stats.SUM,
          period: Duration.minutes(1),
        })
      );

      this.widgets.push(
        new cloudwatch.GraphWidget({
          title: `${props.widgetTitle} Server Errors`,
          left: [this.api.metricCount()],
          right: [this.api.metricServerError()],
          statistic: cloudwatch.Stats.SUM,
          period: Duration.minutes(1),
        })
      );

      this.widgets.push(
        new cloudwatch.GraphWidget({
          title: `${props.widgetTitle} Latency`,
          left: [this.api.metricCount()],
          right: [this.api.metricLatency()],
          statistic: cloudwatch.Stats.AVERAGE,
          period: Duration.minutes(1),
        })
      );
    }
  }
}
