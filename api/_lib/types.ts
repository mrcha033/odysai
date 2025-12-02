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
  nightlife: boolean;
  instagramImportance: number;
}

export interface PlanPackage {
  id: string;
  roomId: string;
  name: string;
  description: string;
  days: DayPlan[];
  themeEmphasis: string[];
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
}

export interface RoomStatus {
  room: Room;
  members: Member[];
  allReady: boolean;
  planPackages?: PlanPackage[];
  selectedPlan?: PlanPackage;
  trip?: Trip;
}
