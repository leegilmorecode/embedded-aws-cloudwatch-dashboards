export type BookHolidayDto = {
  id?: string;
  type: 'ALL_INCLUSIVE' | 'HALF_BOARD';
  starRating: 1 | 2 | 3 | 4 | 5;
  destination: string;
  hotelName: string;
  createdDate?: string;
};
