#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { TravelServiceStatefulStack } from '../stateful/stateful';
import { TravelServiceStatelessStack } from '../stateless/stateless';

const app = new cdk.App();
const travelServiceStatefulStack = new TravelServiceStatefulStack(
  app,
  'TravelServiceStatefulStack',
  {}
);
const travelServiceStatelessStack = new TravelServiceStatelessStack(
  app,
  'TravelServiceStatelessStack',
  {
    table: travelServiceStatefulStack.table,
    dashboardName: 'TravelServiceDashboard', // create a dashboard automatically
    dashboardDescription: '# LJ Travel\nMetrics Dashboard',
  }
);

// add any sibling widgets
travelServiceStatelessStack.addWidgets(travelServiceStatefulStack.getWidgets());
