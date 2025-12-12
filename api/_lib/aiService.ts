import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import { PlanPackage, DayPlan, ActivitySlot, Survey, Room } from './types';

type ItinerarySchemaResult = {
  packages: Array<{
    id?: string;
    name?: string;
    description?: string;
    themeEmphasis?: string[];
    days?: Array<{
      day?: number;
      date?: string;
      summary?: string;
      slots?: Array<{
        id?: string;
        time?: string;
        duration?: number;
        title?: string;
        description?: string;
        location?: string;
        category?: string;
        tags?: string[];
      }>;
    }>;
  }>;
};

type ReplacementSchemaResult = {
  alternatives: Array<{
    id?: string;
    time?: string;
    duration?: number;
    title?: string;
    description?: string;
    location?: string;
    category?: string;
    tags?: string[];
  }>;
};

export class AIService {
  private readonly apiKey?: string;
  private readonly model: string;

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
  }

  async generateInitialPackages(room: Room, surveys: Survey[]): Promise<PlanPackage[]> {
    const dayCount = this.getDayCount(room.dateRange);
    const prompt = this.buildItineraryPrompt(room, surveys, dayCount);

    try {
      const raw = await this.generateStructuredJSON<ItinerarySchemaResult>(
        prompt,
        this.itinerarySchema(dayCount)
      );
      return this.normalizePackages(raw, room, dayCount);
    } catch (error) {
      console.warn('[ai] Falling back to template packages:', (error as Error).message);
      return this.generateTemplatePackages(room, dayCount);
    }
  }

  async refinePackage(currentPlan: PlanPackage, constraints: string[]): Promise<PlanPackage[]> {
    const fallbackDate = new Date().toISOString().split('T')[0];
    const startDate = currentPlan.days[0]?.date || fallbackDate;
    const lastDay = currentPlan.days[currentPlan.days.length - 1];
    const endDate = (lastDay && lastDay.date) || startDate;
    const fallbackCity = currentPlan.days[0]?.slots[0]?.location || '서울';
    const updatedName = `${currentPlan.name} (refined)`;
    const updatedDescription = constraints.length
      ? `${currentPlan.description || '기본 일정'} · 반영사항: ${constraints.join(', ')}`
      : currentPlan.description || 'AI refined plan';

    try {
      const prompt = [
        'You are refining an existing multi-day travel itinerary. Improve realism, pacing, and cohesion.',
        'Respect existing structure while tightening transitions, adding brief summaries, and keeping times feasible.',
        constraints.length ? `Constraints to honor: ${constraints.join(', ')}` : 'No additional constraints.',
        'Return JSON only.',
      ].join('\n');

      const raw = await this.generateStructuredJSON<ItinerarySchemaResult>(
        prompt,
        this.itinerarySchema(currentPlan.days.length)
      );

      const normalized = this.normalizePackages(
        raw,
        { id: currentPlan.roomId, city: fallbackCity, dateRange: { start: startDate, end: endDate }, theme: [], travelerCount: 0, createdAt: '' },
        currentPlan.days.length
      );

      if (normalized.length) {
        return normalized.map(pkg => ({
          ...pkg,
          name: pkg.name || updatedName,
          description: pkg.description || updatedDescription,
        }));
      }
    } catch (error) {
      console.warn('[ai] refinePackage fallback used:', (error as Error).message);
    }

    return [
      { ...currentPlan, name: updatedName, description: updatedDescription },
      { ...currentPlan, name: `${currentPlan.name} (alt)`, description: `${updatedDescription} · 여유로운 이동 동선` },
    ];
  }

  async replaceSpot(
    currentSlot: ActivitySlot,
    reason: string,
    context: {
      day: number;
      location: string;
      themeEmphasis?: string[];
      constraints?: string[];
      dislikes?: string[];
      instagramImportance?: number;
      dayPlanSlots?: ActivitySlot[];
    }
  ): Promise<ActivitySlot[]> {
    const prompt = this.buildReplacementPrompt(currentSlot, reason, context);

    try {
      const raw = await this.generateStructuredJSON<ReplacementSchemaResult>(
        prompt,
        this.replacementSchema()
      );
      return this.normalizeAlternatives(raw, currentSlot, context.location);
    } catch (error) {
      console.warn('[ai] replaceSpot fallback used:', (error as Error).message);
      return this.generateFallbackAlternatives(currentSlot, reason, context.location);
    }
  }

  // --- Prompt builders ----------------------------------------------------

  private buildItineraryPrompt(room: Room, surveys: Survey[], dayCount: number): string {
    const surveySummary = this.summarizeSurveys(surveys);
    const wakeTimes = surveys.map(s => s.wakeUpTime).filter(Boolean);
    const typicalWake = wakeTimes[0] || '08:00';
    const nightlifeRatio = surveys.filter(s => s.nightlife).length / (surveys.length || 1);
    const wantsNightlife = nightlifeRatio >= 0.4;

    return [
      'You are Ody\'sai, a Korean AI travel planner generating group-friendly itineraries.',
      `Destination: ${room.city}. Dates: ${room.dateRange.start} to ${room.dateRange.end} (${dayCount} days).`,
      `Themes to highlight: ${room.theme.join(', ') || 'balancing rest and exploration'}.`,
      `Traveler count: ${room.travelerCount}. Typical wake-up: ${typicalWake}. Nightlife interest: ${wantsNightlife ? 'Yes' : 'Low'}.`,
      `Group emotions: ${surveySummary.emotions.join(', ') || 'balanced'}. Dislikes: ${surveySummary.dislikes.join(', ') || 'none declared'}.`,
      `Constraints: ${surveySummary.constraints.join(', ') || 'none declared'}. Budget: ${surveySummary.budget || 'medium'}. Instagram importance (1-5 avg): ${surveySummary.instagramImportance}.`,
      'Create exactly 3 distinct itinerary packages, varied by vibe (healing, balanced, adventurous, foodie, cultural).',
      'Keep daily schedules realistic: chronological times, 3-5 slots per day, durations 60-210 minutes, reasonable meal times.',
      'Prefer avoiding dislikes and honoring constraints. Include at least one visually appealing spot per day if instagram importance is high.',
      'Return JSON only with the provided schema. Do not include any text outside JSON.',
    ].join('\n');
  }

  private buildReplacementPrompt(
    currentSlot: ActivitySlot,
    reason: string,
    context: {
      day: number;
      location: string;
      themeEmphasis?: string[];
      constraints?: string[];
      dislikes?: string[];
      instagramImportance?: number;
      dayPlanSlots?: ActivitySlot[];
    }
  ): string {
    const otherSlots = (context.dayPlanSlots || [])
      .filter(slot => slot.id !== currentSlot.id)
      .map(slot => `${slot.time} ${slot.title} (${slot.location})`)
      .join(' | ');

    return [
      'You are replacing a single activity inside an existing itinerary. Keep timing cohesive and location-aware.',
      `Current slot (to replace): ${currentSlot.time} for ${currentSlot.duration} minutes, "${currentSlot.title}" in ${context.location}.`,
      `Reason: ${reason}. Day #: ${context.day}. Nearby plan: ${otherSlots || 'no other slots provided'}.`,
      `Avoid dislikes: ${(context.dislikes || []).join(', ') || 'none declared'}. Respect constraints: ${(context.constraints || []).join(', ') || 'none declared'}.`,
      `Themes to preserve: ${(context.themeEmphasis || []).join(', ') || 'balanced experience'}.`,
      `Instagram importance (1-5): ${context.instagramImportance ?? 3}. Prefer photogenic options if >=4.`,
      'Suggest 2-3 alternatives. Keep start times near the original slot (±60 minutes) and durations similar unless explicitly improved.',
      'Return JSON only with the provided schema. Do not add explanations.',
    ].join('\n');
  }

  // --- Gemini helpers -----------------------------------------------------

  private async generateStructuredJSON<T>(prompt: string, schema: any): Promise<T> {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is missing');
    }

    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.6,
        responseMimeType: 'application/json',
        responseSchema: schema,
      },
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    if (!text) {
      throw new Error('Empty response from Gemini');
    }

    return JSON.parse(text) as T;
  }

  private itinerarySchema(dayCount: number) {
    return {
      type: SchemaType.OBJECT,
      properties: {
        packages: {
          type: SchemaType.ARRAY,
          description: 'Exactly three itinerary options',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              themeEmphasis: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
              days: {
                type: SchemaType.ARRAY,
                minItems: dayCount,
                maxItems: dayCount,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    day: { type: SchemaType.INTEGER },
                    date: { type: SchemaType.STRING },
                    summary: { type: SchemaType.STRING },
                    slots: {
                      type: SchemaType.ARRAY,
                      items: {
                        type: SchemaType.OBJECT,
                        properties: {
                          id: { type: SchemaType.STRING },
                          time: { type: SchemaType.STRING },
                          duration: { type: SchemaType.INTEGER },
                          title: { type: SchemaType.STRING },
                          description: { type: SchemaType.STRING },
                          location: { type: SchemaType.STRING },
                          category: { type: SchemaType.STRING },
                          tags: {
                            type: SchemaType.ARRAY,
                            items: { type: SchemaType.STRING },
                          },
                        },
                        required: ['time', 'duration', 'title', 'location', 'category'],
                      },
                    },
                  },
                  required: ['day', 'date', 'slots'],
                },
              },
            },
            required: ['name', 'description', 'days'],
          },
        },
      },
      required: ['packages'],
    };
  }

  private replacementSchema() {
    return {
      type: SchemaType.OBJECT,
      properties: {
        alternatives: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              time: { type: SchemaType.STRING },
              duration: { type: SchemaType.INTEGER },
              title: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              location: { type: SchemaType.STRING },
              category: { type: SchemaType.STRING },
              tags: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING },
              },
            },
            required: ['time', 'duration', 'title', 'location', 'category'],
          },
        },
      },
      required: ['alternatives'],
    };
  }

  // --- Normalizers & fallbacks -------------------------------------------

  private normalizePackages(raw: ItinerarySchemaResult, room: Room, dayCount: number): PlanPackage[] {
    const packages = raw?.packages || [];
    const startDate = new Date(room.dateRange.start);

    return packages.slice(0, 3).map((pkg, pkgIndex) => {
      const days = (pkg.days || []).slice(0, dayCount).map((day, dayIndex) =>
        this.normalizeDayPlan(day, dayIndex, startDate, room.city)
      );

      return {
        id: pkg.id || uuidv4(),
        roomId: room.id,
        name: pkg.name || `AI Package ${pkgIndex + 1}`,
        description: pkg.description || 'AI generated itinerary',
        days,
        themeEmphasis: pkg.themeEmphasis?.length ? pkg.themeEmphasis : this.deriveThemes(room.theme),
      };
    });
  }

  private normalizeDayPlan(day: DayPlan | any, index: number, startDate: Date, city: string): DayPlan {
    const date = day?.date || this.addDays(startDate, index).toISOString().split('T')[0];
    const slots = (day?.slots || []).map((slot: ActivitySlot | any, slotIndex: number) => ({
      id: slot.id || uuidv4(),
      time: slot.time || this.defaultTime(slotIndex),
      duration: slot.duration || 90,
      title: slot.title || slot.name || `활동 ${slotIndex + 1}`,
      description: slot.description || slot.notes || '',
      location: slot.location || city,
      category: slot.category || 'sightseeing',
      tags: slot.tags?.length ? slot.tags : ['auto'],
    }));

    return {
      day: day?.day || index + 1,
      date,
      slots,
    };
  }

  private normalizeAlternatives(raw: ReplacementSchemaResult, currentSlot: ActivitySlot, location: string): ActivitySlot[] {
    const items = raw?.alternatives || [];

    return items.slice(0, 3).map((alt, idx) => ({
      id: alt.id || uuidv4(),
      time: alt.time || currentSlot.time,
      duration: alt.duration || currentSlot.duration,
      title: alt.title || `대체 활동 ${idx + 1}`,
      description: alt.description || 'AI가 제안한 대체 활동',
      location: alt.location || location,
      category: alt.category || currentSlot.category || 'activity',
      tags: alt.tags?.length ? alt.tags : ['alternative'],
    }));
  }

  private generateTemplatePackages(room: Room, dayCount: number): PlanPackage[] {
    return [
      this.createTemplatePackage(room, dayCount, 'healing', '힐링 중심형', '여유로운 일정, 자연과 휴식'),
      this.createTemplatePackage(room, dayCount, 'balanced', '밸런스형', '관광과 휴식의 균형'),
      this.createTemplatePackage(room, dayCount, 'adventure', '모험 중심형', '액티비티와 새로운 경험'),
    ];
  }

  private createTemplatePackage(room: Room, dayCount: number, type: string, name: string, description: string): PlanPackage {
    const days: DayPlan[] = [];
    const startDate = new Date(room.dateRange.start);

    for (let i = 0; i < dayCount; i++) {
      const date = this.addDays(startDate, i).toISOString().split('T')[0];

      days.push({
        day: i + 1,
        date,
        slots: this.generateDaySlots(i + 1, type, room.city),
      });
    }

    return {
      id: uuidv4(),
      roomId: room.id,
      name,
      description,
      days,
      themeEmphasis: this.deriveThemes([type]),
    };
  }

  private generateFallbackAlternatives(currentSlot: ActivitySlot, reason: string, location: string): ActivitySlot[] {
    const categories = ['cafe', 'museum', 'shopping', 'restaurant', 'park'];

    return Array.from({ length: 3 }).map((_, idx) => ({
      id: uuidv4(),
      time: currentSlot.time,
      duration: currentSlot.duration,
      title: `대체 활동 ${idx + 1}`,
      description: `${reason} 상황에 맞춘 대안 제안`,
      location,
      category: categories[idx % categories.length],
      tags: ['fallback', 'alternative'],
    }));
  }

  // --- Utilities ----------------------------------------------------------

  private summarizeSurveys(surveys: Survey[]) {
    const emotions = new Set<string>();
    const dislikes = new Set<string>();
    const constraints = new Set<string>();
    let budgetScore = 0;
    let instaScore = 0;

    surveys.forEach(s => {
      s.emotions.forEach(e => emotions.add(e));
      s.dislikes.forEach(d => dislikes.add(d));
      s.constraints.forEach(c => constraints.add(c));
      budgetScore += this.budgetToScore(s.budgetLevel);
      instaScore += s.instagramImportance || 3;
    });

    const count = Math.max(surveys.length, 1);

    return {
      emotions: Array.from(emotions),
      dislikes: Array.from(dislikes),
      constraints: Array.from(constraints),
      budget: this.scoreToBudget(Math.round(budgetScore / count)),
      instagramImportance: Math.round(instaScore / count),
    };
  }

  private budgetToScore(level: Survey['budgetLevel']) {
    switch (level) {
      case 'low':
        return 1;
      case 'medium':
        return 2;
      case 'high':
        return 3;
      default:
        return 2;
    }
  }

  private scoreToBudget(score: number): 'low' | 'medium' | 'high' {
    if (score <= 1) return 'low';
    if (score >= 3) return 'high';
    return 'medium';
  }

  private deriveThemes(themes: string[]) {
    if (!themes.length) return ['힐링', '탐험', '미식'];
    if (themes.length >= 3) return themes.slice(0, 3);
    return [...themes, '여유', '로컬'].slice(0, 3);
  }

  private defaultTime(index: number): string {
    const template = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:00'];
    return template[index % template.length];
  }

  private generateDaySlots(day: number, type: string, city: string): ActivitySlot[] {
    const slots: ActivitySlot[] = [];

    if (type === 'healing') {
      slots.push(
        { id: uuidv4(), time: '09:00', duration: 120, title: '여유로운 브런치', description: `${city}의 인기 브런치 카페`, location: city, category: 'food', tags: ['브런치', '카페'] },
        { id: uuidv4(), time: '11:30', duration: 180, title: '자연 산책', description: '공원 또는 해변 산책', location: city, category: 'nature', tags: ['힐링', '자연'] },
        { id: uuidv4(), time: '15:00', duration: 120, title: '스파/마사지', description: '힐링 타임', location: city, category: 'wellness', tags: ['휴식', '힐링'] },
        { id: uuidv4(), time: '18:00', duration: 120, title: '로컬 맛집 저녁', description: '여유로운 저녁 식사', location: city, category: 'food', tags: ['맛집', '저녁'] }
      );
    } else if (type === 'adventure') {
      slots.push(
        { id: uuidv4(), time: '08:00', duration: 60, title: '빠른 아침', description: '간단한 아침 식사', location: city, category: 'food', tags: ['아침'] },
        { id: uuidv4(), time: '09:30', duration: 240, title: '액티비티 체험', description: '패러글라이딩, 서핑 등', location: city, category: 'activity', tags: ['모험', '액티비티'] },
        { id: uuidv4(), time: '14:00', duration: 120, title: '로컬 투어', description: '현지 명소 탐방', location: city, category: 'tour', tags: ['관광', '문화'] },
        { id: uuidv4(), time: '17:00', duration: 180, title: '나이트라이프', description: '바/클럽', location: city, category: 'nightlife', tags: ['밤문화', '파티'] }
      );
    } else {
      slots.push(
        { id: uuidv4(), time: '09:00', duration: 90, title: '호텔 조식', description: '여유로운 아침', location: city, category: 'food', tags: ['아침'] },
        { id: uuidv4(), time: '11:00', duration: 150, title: '주요 관광지', description: `${city} 대표 명소`, location: city, category: 'sightseeing', tags: ['관광', '명소'] },
        { id: uuidv4(), time: '14:00', duration: 90, title: '점심 & 쇼핑', description: '식사 + 기념품', location: city, category: 'shopping', tags: ['쇼핑', '점심'] },
        { id: uuidv4(), time: '16:30', duration: 120, title: '카페 휴식', description: '인스타 감성 카페', location: city, category: 'cafe', tags: ['카페', '휴식'] },
        { id: uuidv4(), time: '19:00', duration: 120, title: '저녁 식사', description: '로컬 맛집', location: city, category: 'food', tags: ['저녁', '맛집'] }
      );
    }

    return slots;
  }

  private addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private getDayCount(dateRange: { start: string; end: string }): number {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }
}

export const aiService = new AIService();
