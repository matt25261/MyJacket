export interface Jacket {
  id: string;
  hangerNumber: string;
  phoneNumber: string;
  countryCode: string;
  qrCode: string;
  webLink?: string;
  deepLink?: string;
  status: 'active' | 'retrieved';
  depositTime: string;
  retrievalTime?: string;
  venueId?: string;
}

export interface JacketStats {
  total: number;
  active: number;
  retrieved: number;
  todayDeposits: number;
}
