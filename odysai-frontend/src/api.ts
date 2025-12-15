import { Room, Member, Survey, RoomStatus, PlanPackage, ActivitySlot } from './types';

// Use Vercel serverless (/api) by default; can override via VITE_API_BASE_URL
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

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

  async votePlan(roomId: string, memberId: string, planId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, planId }),
    });
    return res.json();
  },

  async getVotes(roomId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans/vote`);
    return res.json();
  },

  async updatePlan(roomId: string, planId: string, updates: Partial<PlanPackage>) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId, updates }),
    });
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

  async completeTrip(tripId: string, payload: { dayEmotions?: string[]; photos?: string[]; feedback?: string }) {
    const res = await fetch(`${API_BASE}/trips/${tripId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  async getConflictReport(roomId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/preferences/conflicts`);
    return res.json();
  },
};
