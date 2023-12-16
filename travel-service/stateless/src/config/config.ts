const convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The database table where we store holidays',
    format: String,
    default: 'tableName',
    env: 'TABLE_NAME',
  },
  randomErrorBool: {
    doc: 'Whether or not we throw random errors',
    format: String,
    default: 'false',
    env: 'RANDOM_ERROR',
  },
  email: {
    doc: 'The email for the sns topic',
    format: String,
    default: 'your.email@gmail.com',
  },
  namespace: {
    doc: 'The namespace for the metrics',
    format: String,
    default: 'HolidaysNamespace',
  },
  service: {
    doc: 'The service for the metrics',
    format: String,
    default: 'TravelService',
  },
  region: {
    doc: 'The region for the solution',
    format: String,
    default: 'eu-west-1',
  },
}).validate({ allowed: 'strict' });
