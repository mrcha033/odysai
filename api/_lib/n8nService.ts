import {
  PlanInitializeInput,
  PlanInitializeOutput,
  PlanRefineInput,
  PlanRefineOutput,
  TripReplaceSpotInput,
  TripReplaceSpotOutput,
  TripReportInput,
  TripReportOutput,
  BudgetLevel,
} from './n8nTypes';
import { Survey, Room } from './types';

class N8nService {
  private readonly baseUrl: string;
  private readonly planInitializePath: string;
  private readonly planRefinePath: string;
  private readonly tripReplaceSpotPath: string;
  private readonly tripReportPath: string;

  constructor() {
    this.baseUrl = process.env.N8N_BASE_URL || 'https://prepcto.app.n8n.cloud';
    this.planInitializePath = process.env.N8N_PLAN_INITIALIZE_PATH || '/webhook/388e4a39-35ec-4528-8e85-b3d87397d9f5';
    this.planRefinePath = process.env.N8N_PLAN_REFINE_PATH || '/webhook/3ace88cd-d82c-430a-a6d8-44a909a98782';
    this.tripReplaceSpotPath = process.env.N8N_TRIP_REPLACE_SPOT_PATH || '/webhook/09af4612-7c3d-411e-abfe-b97e3b8651af';
    this.tripReportPath = process.env.N8N_TRIP_REPORT_PATH || '/webhook/dc483177-7150-4162-87cc-39741450a85d';
  }

  /**
   * Call n8n plan-initialize workflow
   */
  async generateInitialPackages(
    room: Room,
    surveys: Survey[],
    members: Array<{ id: string; nickname: string }>
  ): Promise<PlanInitializeOutput> {
    const input: PlanInitializeInput = {
      roomId: room.id,
      basicInfo: {
        cities: [room.city],
        startDate: room.dateRange.start,
        endDate: room.dateRange.end,
        themeTags: room.theme,
      },
      members: members.map((member, index) => ({
        memberId: member.id,
        nickname: member.nickname,
        survey: {
          emotions: surveys[index]?.emotions || [],
          dislikes: surveys[index]?.dislikes || [],
          constraints: surveys[index]?.constraints || [],
          budgetLevel: this.mapBudgetLevel(surveys[index]?.budgetLevel),
          instagramImportance: surveys[index]?.instagramImportance || 3,
        },
      })),
    };

    const url = `${this.baseUrl}${this.planInitializePath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`n8n plan-initialize failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result as PlanInitializeOutput;
  }

  /**
   * Call n8n plan-refine workflow
   */
  async refinePackage(
    input: PlanRefineInput
  ): Promise<PlanRefineOutput> {
    const url = `${this.baseUrl}${this.planRefinePath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`n8n plan-refine failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result as PlanRefineOutput;
  }

  /**
   * Call n8n trip-replace-spot workflow
   */
  async replaceSpot(
    input: TripReplaceSpotInput
  ): Promise<TripReplaceSpotOutput> {
    const url = `${this.baseUrl}${this.tripReplaceSpotPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`n8n trip-replace-spot failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result as TripReplaceSpotOutput;
  }

  /**
   * Call n8n trip-report workflow
   */
  async generateTripReport(
    input: TripReportInput
  ): Promise<TripReportOutput> {
    const url = `${this.baseUrl}${this.tripReportPath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`n8n trip-report failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result as TripReportOutput;
  }

  // Helper methods
  private mapBudgetLevel(level?: 'low' | 'medium' | 'high'): BudgetLevel {
    if (!level) return 'MID';
    switch (level) {
      case 'low':
        return 'LOW';
      case 'medium':
        return 'MID';
      case 'high':
        return 'HIGH';
      default:
        return 'MID';
    }
  }
}

export const n8nService = new N8nService();
