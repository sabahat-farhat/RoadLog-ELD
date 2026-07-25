export interface LocationInput {
  label: string;
  lat: number;
  lon: number;
}

export interface TripRequest {
  current_location: LocationInput;
  pickup_location: LocationInput;
  dropoff_location: LocationInput;
  current_cycle_used: number;
}

export type StopType = "pickup" | "dropoff" | "fuel" | "break" | "rest" | "restart";

export interface Stop {
  type: StopType;
  label: string;
  lat: number;
  lon: number;
  start: string;
  end: string;
  duration_hours: number;
}

export type DutyStatus = "off_duty" | "sleeper_berth" | "driving" | "on_duty";

export interface LogLocation {
  lat: number;
  lon: number;
  label: string | null;
}

export interface DaySegment {
  status: DutyStatus;
  status_label: string;
  start_hour: number;
  end_hour: number;
  location: LogLocation;
}

export interface Remark {
  time_hour: number;
  time_str: string;
  label: string;
  location: string | null;
}

export interface DailyLog {
  date: string;
  segments: DaySegment[];
  totals: Record<DutyStatus, number>;
  total_miles: number;
  remarks: Remark[];
}

export interface Trip {
  id: number;
  created_at: string;
  current_label: string;
  current_lat: number;
  current_lon: number;
  pickup_label: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_label: string;
  dropoff_lat: number;
  dropoff_lon: number;
  current_cycle_used: number;
  total_miles: number;
  total_drive_hours: number;
  total_days: number;
  route_geometry: [number, number][];
  stops: Stop[];
  daily_logs: DailyLog[];
}

export interface TripSummary {
  id: number;
  created_at: string;
  current_label: string;
  pickup_label: string;
  dropoff_label: string;
  total_miles: number;
  total_drive_hours: number;
  total_days: number;
}
