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
  conflictReport?: ConflictReport;
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

export interface PreferenceProfile {
  memberId: string;
  nickname: string;
  budgetScore: number; // 1-3
  wakeMinutes: number;
  emotions: string[];
  dislikes: string[];
  constraints: string[];
  instagramImportance: number; // 1-5
}

export interface ConflictItem {
  type: 'budget' | 'wake' | 'dislike' | 'constraint' | 'instagram';
  severity: 'low' | 'medium' | 'high';
  description: string;
  membersInvolved: string[];
}

export interface ConsensusBand {
  budget: 'low' | 'medium' | 'high';
  wakeWindow: { start: string; end: string };
  dominantEmotions: string[];
  sharedConstraints: string[];
}

export interface ConflictReport {
  profiles: PreferenceProfile[];
  consensus: ConsensusBand;
  conflicts: ConflictItem[];
}

export interface PlanVotes {
  tallies: Record<string, number>; // planId -> votes
  voters: Record<string, string>; // memberId -> planId
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
}
