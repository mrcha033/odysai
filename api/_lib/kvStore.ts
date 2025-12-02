import { kv } from '@vercel/kv';
import { Room, Member, PlanPackage, Trip } from './types';

class KVDataStore {
  // Rooms
  async createRoom(room: Room): Promise<Room> {
    await kv.set(`room:${room.id}`, room);
    return room;
  }

  async getRoom(id: string): Promise<Room | null> {
    return await kv.get<Room>(`room:${id}`);
  }

  // Members
  async addMember(member: Member): Promise<Member> {
    await kv.set(`member:${member.id}`, member);
    // Add to room's member list
    await kv.sadd(`room:${member.roomId}:members`, member.id);
    return member;
  }

  async getMember(id: string): Promise<Member | null> {
    return await kv.get<Member>(`member:${id}`);
  }

  async getRoomMembers(roomId: string): Promise<Member[]> {
    const memberIds = await kv.smembers(`room:${roomId}:members`);
    const members: Member[] = [];

    for (const memberId of memberIds) {
      const member = await kv.get<Member>(`member:${memberId}`);
      if (member) members.push(member);
    }

    return members;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
    const member = await this.getMember(id);
    if (!member) return null;

    const updated = { ...member, ...updates };
    await kv.set(`member:${id}`, updated);
    return updated;
  }

  // Plan Packages
  async setPlanPackages(roomId: string, packages: PlanPackage[]): Promise<void> {
    await kv.set(`room:${roomId}:plans`, packages);
  }

  async getPlanPackages(roomId: string): Promise<PlanPackage[] | null> {
    return await kv.get<PlanPackage[]>(`room:${roomId}:plans`);
  }

  // Trips
  async createTrip(trip: Trip): Promise<Trip> {
    await kv.set(`trip:${trip.id}`, trip);
    await kv.set(`room:${trip.roomId}:trip`, trip.id);
    return trip;
  }

  async getTripByRoom(roomId: string): Promise<Trip | null> {
    const tripId = await kv.get<string>(`room:${roomId}:trip`);
    if (!tripId) return null;
    return await kv.get<Trip>(`trip:${tripId}`);
  }

  async getTrip(id: string): Promise<Trip | null> {
    return await kv.get<Trip>(`trip:${id}`);
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | null> {
    const trip = await this.getTrip(id);
    if (!trip) return null;

    const updated = { ...trip, ...updates };
    await kv.set(`trip:${id}`, updated);
    return updated;
  }
}

export const store = new KVDataStore();
