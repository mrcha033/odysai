import Redis from 'ioredis';
import { Room, Member, PlanPackage, Trip } from './types';
import { PlanVotes, TripReport } from './types';

// Create Redis client from REDIS_URL or KV_URL
const redis = new Redis(process.env.REDIS_URL || process.env.KV_URL || '');

class KVDataStore {
  // Rooms
  async createRoom(room: Room): Promise<Room> {
    await redis.set(`room:${room.id}`, JSON.stringify(room));
    return room;
  }

  async getRoom(id: string): Promise<Room | null> {
    const data = await redis.get(`room:${id}`);
    return data ? JSON.parse(data) : null;
  }

  // Members
  async addMember(member: Member): Promise<Member> {
    await redis.set(`member:${member.id}`, JSON.stringify(member));
    // Add to room's member list
    await redis.sadd(`room:${member.roomId}:members`, member.id);
    return member;
  }

  async getMember(id: string): Promise<Member | null> {
    const data = await redis.get(`member:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async getRoomMembers(roomId: string): Promise<Member[]> {
    const memberIds = await redis.smembers(`room:${roomId}:members`);
    const members: Member[] = [];

    for (const memberId of memberIds) {
      const data = await redis.get(`member:${memberId}`);
      if (data) members.push(JSON.parse(data));
    }

    return members;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
    const member = await this.getMember(id);
    if (!member) return null;

    const updated = { ...member, ...updates };
    await redis.set(`member:${id}`, JSON.stringify(updated));
    return updated;
  }

  // Plan Packages
  async setPlanPackages(roomId: string, packages: PlanPackage[]): Promise<void> {
    await redis.set(`room:${roomId}:plans`, JSON.stringify(packages));
  }

  async getPlanPackages(roomId: string): Promise<PlanPackage[] | null> {
    const data = await redis.get(`room:${roomId}:plans`);
    return data ? JSON.parse(data) : null;
  }

  // Trips
  async createTrip(trip: Trip): Promise<Trip> {
    await redis.set(`trip:${trip.id}`, JSON.stringify(trip));
    await redis.set(`room:${trip.roomId}:trip`, trip.id);
    return trip;
  }

  async getTripByRoom(roomId: string): Promise<Trip | null> {
    const tripId = await redis.get(`room:${roomId}:trip`);
    if (!tripId) return null;
    const data = await redis.get(`trip:${tripId}`);
    return data ? JSON.parse(data) : null;
  }

  async getTrip(id: string): Promise<Trip | null> {
    const data = await redis.get(`trip:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | null> {
    const trip = await this.getTrip(id);
    if (!trip) return null;

    const updated = { ...trip, ...updates };
    await redis.set(`trip:${id}`, JSON.stringify(updated));
    return updated;
  }

  // Voting
  async setVotes(roomId: string, votes: PlanVotes): Promise<void> {
    await redis.set(`room:${roomId}:votes`, JSON.stringify(votes));
  }

  async getVotes(roomId: string): Promise<PlanVotes | null> {
    const data = await redis.get(`room:${roomId}:votes`);
    return data ? JSON.parse(data) : null;
  }
}

export const store = new KVDataStore();
