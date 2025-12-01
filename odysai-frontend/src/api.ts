import { Room, Member, Survey, RoomStatus, PlanPackage, ActivitySlot } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export const api = {
  async createRoom(data: {
    city: string;
    dateRange: { start: string; end: string };
    theme: string[];
    travelerCount: number;
  }): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getRoomStatus(roomId: string): Promise<RoomStatus> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}`);
    return res.json();
  },

  async joinRoom(roomId: string, nickname: string): Promise<Member> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    return res.json();
  },

  async submitSurvey(memberId: string, survey: Survey): Promise<Member> {
    const res = await fetch(`${API_BASE}/members/${memberId}/survey`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(survey),
    });
    return res.json();
  },

  async generatePlans(roomId: string): Promise<PlanPackage[]> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans/generate`, {
      method: 'POST',
    });
    return res.json();
  },

  async getPlans(roomId: string): Promise<PlanPackage[]> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`);
    return res.json();
  },

  async selectPlan(roomId: string, planId: string): Promise<PlanPackage> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    return res.json();
  },

  async setReady(memberId: string, isReady: boolean): Promise<Member> {
    const res = await fetch(`${API_BASE}/members/${memberId}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isReady }),
    });
    return res.json();
  },

  async startTrip(roomId: string, planId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/trips/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    });
    return res.json();
  },

  async replaceSpot(tripId: string, slotId: string, reason: string, day: number): Promise<ActivitySlot[]> {
    const res = await fetch(`${API_BASE}/trips/${tripId}/replace-spot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slotId, reason, day }),
    });
    return res.json();
  },
};
