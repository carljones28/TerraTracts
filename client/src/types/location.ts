// Location-related types for the application

export interface LocationSuggestion {
  id: string;
  mainText: string;
  secondaryText?: string;
  type: 'city' | 'region' | 'address';
  coordinates?: { lat: number; lng: number };
}

export interface UserLocation {
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface StateMapping {
  [key: string]: string;
}