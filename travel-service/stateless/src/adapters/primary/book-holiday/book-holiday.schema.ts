export const schema = {
  type: 'object',
  required: ['type', 'starRating', 'destination', 'hotelName'],
  maxProperties: 4,
  minProperties: 4,
  properties: {
    type: {
      type: 'string',
      enum: ['ALL_INCLUSIVE', 'HALF_BOARD'],
    },
    starRating: {
      type: 'integer',
      minimum: 1,
      maximum: 5,
    },
    destination: {
      type: 'string',
    },
    hotelName: {
      type: 'string',
    },
  },
};
