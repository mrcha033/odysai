import { PlanPackage, DayPlan, ActivitySlot, Survey, Room } from './types';
import { v4 as uuidv4 } from 'uuid';

// Mock AI service that simulates n8n workflows
export class AIService {

  async generateInitialPackages(
    room: Room,
    surveys: Survey[]
  ): Promise<PlanPackage[]> {
    // Simulate API delay
    await this.delay(1500);

    const dayCount = this.getDayCount(room.dateRange);

    // Generate 3 different themed packages
    return [
      this.createPackage(room, dayCount, 'healing', '힐링 중심형', '여유로운 일정, 자연과 휴식'),
      this.createPackage(room, dayCount, 'balanced', '밸런스형', '관광과 휴식의 균형'),
      this.createPackage(room, dayCount, 'adventure', '모험 중심형', '액티비티와 새로운 경험'),
    ];
  }

  async refinePackage(
    currentPlan: PlanPackage,
    constraints: string[]
  ): Promise<PlanPackage[]> {
    await this.delay(1000);

    // Return 2 refined versions
    return [
      { ...currentPlan, name: currentPlan.name + ' (최적화 v1)' },
      { ...currentPlan, name: currentPlan.name + ' (최적화 v2)' },
    ];
  }

  async replaceSpot(
    currentSlot: ActivitySlot,
    reason: string,
    context: { day: number; location: string }
  ): Promise<ActivitySlot[]> {
    await this.delay(800);

    // Generate 2-3 alternative activities
    const alternatives: ActivitySlot[] = [];
    const categories = ['cafe', 'museum', 'shopping', 'restaurant'];

    for (let i = 0; i < 3; i++) {
      alternatives.push({
        id: uuidv4(),
        time: currentSlot.time,
        duration: currentSlot.duration,
        title: `대체 장소 ${i + 1}`,
        description: `${reason}로 인한 대안 활동`,
        location: context.location,
        category: categories[i % categories.length],
        tags: ['indoor', 'alternative'],
      });
    }

    return alternatives;
  }

  private createPackage(
    room: Room,
    dayCount: number,
    type: string,
    name: string,
    description: string
  ): PlanPackage {
    const days: DayPlan[] = [];
    const startDate = new Date(room.dateRange.start);

    for (let i = 0; i < dayCount; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      days.push({
        day: i + 1,
        date: date.toISOString().split('T')[0],
        slots: this.generateDaySlots(i + 1, type, room.city),
      });
    }

    return {
      id: uuidv4(),
      roomId: room.id,
      name,
      description,
      days,
      themeEmphasis: type === 'healing' ? ['휴식', '자연'] : type === 'adventure' ? ['모험', '액티비티'] : ['관광', '문화'],
    };
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

  private getDayCount(dateRange: { start: string; end: string }): number {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const aiService = new AIService();
