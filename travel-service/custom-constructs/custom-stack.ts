import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

import { Construct } from 'constructs';
import { CloudwatchDashboard } from './cloudwatch-dashboard';

export interface CustomStackProps extends cdk.StackProps {
  dashboardName?: string;
  dashboardDescription?: string;
}

export class CustomStack extends cdk.Stack {
  private readonly dashboard: cloudwatch.Dashboard;
  public readonly widgets: cloudwatch.ConcreteWidget[] = [];
  private readonly createDashboard: boolean;

  constructor(scope: Construct, id: string, props?: CustomStackProps) {
    super(scope, id, props);

    this.createDashboard =
      props?.dashboardName && props?.dashboardDescription ? true : false;

    // if dashboard properties have been added then create a dashboard
    if (this.createDashboard) {
      this.dashboard = new CloudwatchDashboard(this, id + 'Dashboard', {
        dashboardName: props?.dashboardName as string,
        dashboardDesctiption: props?.dashboardDescription as string,
      }).dashboard;
    }
  }

  public addWidget(widget: cloudwatch.ConcreteWidget): void {
    this.widgets.push(widget);
    if (this.createDashboard) {
      this.dashboard.addWidgets(widget);
    }
  }

  public addWidgets(widgets: cloudwatch.ConcreteWidget[]): void {
    this.widgets.push(...widgets);

    if (this.createDashboard) {
      this.dashboard.addWidgets(...widgets);
    }
  }

  public getWidgets(): cloudwatch.ConcreteWidget[] {
    return this.widgets;
  }

  public getDashboard(): cloudwatch.Dashboard {
    return this.dashboard;
  }
}
