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
      body: JSON.stringify({ action: 'join', nickname }),
    });
    return res.json();
  },

  async submitSurvey(roomId: string, memberId: string, survey: Survey): Promise<Member> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'survey', memberId, survey }),
    });
    return res.json();
  },

  async generatePlans(roomId: string): Promise<PlanPackage[]> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'generate' }),
    });
    return res.json();
  },

  async getPlans(roomId: string): Promise<PlanPackage[]> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`);
    return res.json();
  },

  async votePlan(roomId: string, memberId: string, planId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'vote', memberId, planId }),
    });
    return res.json();
  },

  async getVotes(roomId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'votes' }),
    });
    return res.json();
  },

  async updatePlan(roomId: string, planId: string, updates: Partial<PlanPackage>) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', planId, updates }),
    });
    return res.json();
  },

  async selectPlan(roomId: string, planId: string): Promise<PlanPackage> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'select', planId }),
    });
    return res.json();
  },

  async setReady(roomId: string, memberId: string, isReady: boolean): Promise<Member> {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/members`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ready', memberId, isReady }),
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
    const res = await fetch(`${API_BASE}/trips/${tripId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'replace-spot', slotId, reason, day }),
    });
    return res.json();
  },

  async completeTrip(tripId: string, payload: { dayEmotions?: string[]; photos?: string[]; feedback?: string }) {
    const res = await fetch(`${API_BASE}/trips/${tripId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', ...payload }),
    });
    return res.json();
  },

  async getConflictReport(roomId: string) {
    const res = await fetch(`${API_BASE}/rooms/${roomId}/preferences/conflicts`);
    return res.json();
  },

  async generateReportImage(tripId: string): Promise<{ imageData: string }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'report-image' }),
    });
    return res.json();
  },

  async addTripPhoto(tripId: string, url: string): Promise<{ photos: string[] }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'photo-add', url }),
    });
    return res.json();
  },

  async getTripPhotos(tripId: string): Promise<{ photos: string[] }> {
    const res = await fetch(`${API_BASE}/trips/${tripId}`);
    return res.json();
  },

  async getTrip(tripId: string) {
    const res = await fetch(`${API_BASE}/trips/${tripId}`);
    return res.json();
  },
};
