// n8n Workflow Input/Output Types
// These match the schemas defined in the n8n workflow prompts

export type BudgetLevel = 'LOW' | 'MID' | 'HIGH';
export type WeatherCondition = 'CLEAR' | 'RAIN' | 'HEAVY_RAIN' | 'HOT' | 'COLD' | 'UNKNOWN';
export type ReplaceReason = 'WEATHER' | 'TRANSPORT' | 'ENERGY' | 'MOOD_CHANGE' | 'OTHER';

// plan-initialize input
export interface PlanInitializeInput {
  roomId: string;
  basicInfo: {
    cities: string[];
    startDate: string;
    endDate: string;
    themeTags: string[];
  };
  members: Array<{
    memberId: string;
    nickname: string;
    survey: {
      emotions: string[];
      dislikes: string[];
      constraints: string[];
      budgetLevel: BudgetLevel;
      instagramImportance: number;
    };
  }>;
}

// plan-initialize output
export interface PlanInitializeOutput {
  packages: Array<{
    id: string;
    label: string;
    description: string;
    days: Array<{
      date: string;
      summary: string;
      slots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        place: {
          id: string;
          name: string;
          category: string;
          city: string;
          tags: string[];
          notes: string;
        };
      }>;
    }>;
    scoreSummary: string;
  }>;
  rationale: string;
}

// plan-refine input
export interface PlanRefineInput {
  roomId: string;
  basicInfo: {
    cities: string[];
    startDate: string;
    endDate: string;
    themeTags: string[];
  };
  aggregateSurveySummary: {
    dominantEmotions: string[];
    commonDislikes: string[];
    constraints: string[];
    budgetLevel: BudgetLevel;
    instagramImportanceAvg: number;
  };
  currentDraftPackage: {
    id: string;
    label: string;
    days: Array<{
      date: string;
      slots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        place: {
          id: string;
          name: string;
          category: string;
          city: string;
          tags: string[];
          notes: string;
        };
      }>;
    }>;
  };
  constraints: {
    maxWalkingMinutesPerDay: number | null;
    budgetLevel: BudgetLevel;
    preferIndoorIfBadWeatherFlag: boolean | null;
  };
}

// plan-refine output
export interface PlanRefineOutput {
  refinedPackages: Array<{
    id: string;
    label: string;
    description: string;
    days: Array<{
      date: string;
      summary: string;
      slots: Array<{
        id: string;
        startTime: string;
        endTime: string;
        place: {
          id: string;
          name: string;
          category: string;
          city: string;
          tags: string[];
          notes: string;
        };
      }>;
    }>;
    changeSummary: string;
  }>;
  globalComments: string;
}

// trip-replace-spot input
export interface TripReplaceSpotInput {
  tripId: string;
  date: string;
  slotToReplace: {
    id: string;
    startTime: string;
    endTime: string;
    place: {
      id: string;
      name: string;
      category: string;
      city: string;
      tags: string[];
      notes: string;
    };
  };
  reason: ReplaceReason;
  context: {
    currentCity: string;
    timeNow: string;
    weather: WeatherCondition;
    budgetLevel: BudgetLevel;
    dominantEmotions: string[];
    instagramImportanceAvg: number;
    sameAreaHint: string | null;
  };
  dayPlan: {
    date: string;
    slots: Array<{
      startTime: string;
      endTime: string;
      place: {
        name: string;
        category: string;
        city: string;
        tags: string[];
      };
    }>;
  };
}

// trip-replace-spot output
export interface TripReplaceSpotOutput {
  replacements: Array<{
    id: string;
    name: string;
    category: string;
    city: string;
    tags: string[];
    suggestedTime: {
      startTime: string;
      endTime: string;
    };
    reasonSummary: string;
    pros: string[];
    cons: string[];
  }>;
  notesForPlanner: string;
}

// trip-report input
export interface TripReportInput {
  tripId: string;
  tripName: string;
  cities: string[];
  dateRange: {
    startDate: string;
    endDate: string;
  };
  aggregateSurveySummary: {
    dominantEmotions: string[];
    constraints: string[];
    budgetLevel: BudgetLevel;
    instagramImportanceAvg: number;
  };
  finalPlan: {
    days: Array<{
      date: string;
      slots: Array<{
        startTime: string;
        endTime: string;
        place: {
          name: string;
          category: string;
          city: string;
          tags: string[];
        };
      }>;
    }>;
  };
  feedback: {
    overallRating: number;
    highlights: string[];
    lowlights: string[];
    perMemberNotes: Array<{
      nickname: string;
      comment: string | null;
    }>;
  };
}

// trip-report output
export interface TripReportOutput {
  title: string;
  subtitle: string;
  keywords: string[];
  tripSummary: string;
  highlightMoments: Array<{
    title: string;
    description: string;
  }>;
  memberSnapshots: Array<{
    nickname: string;
    oneLine: string;
  }>;
  closingLine: string;
  designHints: {
    overallMood: string;
    emojiSuggestions: string[];
    layoutHint: string;
  };
}
