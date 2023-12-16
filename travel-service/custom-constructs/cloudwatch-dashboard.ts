import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import { Construct } from 'constructs';

interface DashboardProps extends cloudwatch.DashboardProps {
  /**
   * The dashboard description in markdown
   */
  dashboardDesctiption: string;
}

export class CloudwatchDashboard extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: DashboardProps) {
    super(scope, id);

    // add the dashboard
    this.dashboard = new cloudwatch.Dashboard(this, id + 'Dashboard', {
      ...props,
    });
    this.dashboard.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // add the title text widget as standard
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: props.dashboardDesctiption,
        width: 24,
        height: 2,
      })
    );
  }
}
