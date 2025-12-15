export interface Room {
  id: string;
  city: string;
  dateRange: { start: string; end: string };
  theme: string[];
  travelerCount: number;
  createdAt: string;
}

export interface Member {
  id: string;
  roomId: string;
  nickname: string;
  surveyCompleted: boolean;
  isReady: boolean;
  survey?: Survey;
}

export interface Survey {
  emotions: string[];
  dislikes: string[];
  budgetLevel: 'low' | 'medium' | 'high';
  constraints: string[];
  wakeUpTime: string;
  instagramImportance: number;
  priority?: 'low' | 'medium' | 'high';
  mustHaves?: string[];
  wakeFlexibilityMinutes?: number;
  travelPurpose?: string[];
  staminaLevel?: 'low' | 'medium' | 'high';
  maxTravelMinutes?: number;
}

export interface PlanPackage {
  id: string;
  roomId: string;
  name: string;
  description: string;
  days: DayPlan[];
  themeEmphasis: string[];
  fitScore?: PlanFitScore;
  votes?: number;
}

export interface DayPlan {
  day: number;
  date: string;
  slots: ActivitySlot[];
}

export interface ActivitySlot {
  id: string;
  time: string;
  duration: number;
  title: string;
  description: string;
  location: string;
  category: string;
  tags: string[];
}

export interface Trip {
  id: string;
  roomId: string;
  plan: PlanPackage;
  status: 'active' | 'completed';
  startDate: string;
  currentDay: number;
  report?: TripReport;
}

export interface RoomStatus {
  room: Room;
  members: Member[];
  allReady: boolean;
  planPackages?: PlanPackage[];
  selectedPlan?: PlanPackage;
  trip?: Trip;
}

export interface PlanFitScore {
  groupScore: number;
  perMember: Array<{ memberId: string; nickname: string; score: number; notes: string[] }>;
  drivers: string[];
  warnings: string[];
}

export interface TripReportCard {
  title: string;
  body: string;
  tags: string[];
  day?: number;
}

export interface TripReport {
  tripId: string;
  summary: string;
  highlights: string[];
  cards: TripReportCard[];
  shareUrl?: string;
  heroImageData?: string;
}
