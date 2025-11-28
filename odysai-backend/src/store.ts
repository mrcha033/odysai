import { Room, Member, PlanPackage, Trip } from './types';

class DataStore {
  private rooms: Map<string, Room> = new Map();
  private members: Map<string, Member> = new Map();
  private planPackages: Map<string, PlanPackage[]> = new Map();
  private trips: Map<string, Trip> = new Map();

  // Rooms
  createRoom(room: Room): Room {
    this.rooms.set(room.id, room);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  // Members
  addMember(member: Member): Member {
    this.members.set(member.id, member);
    return member;
  }

  getMember(id: string): Member | undefined {
    return this.members.get(id);
  }

  getRoomMembers(roomId: string): Member[] {
    return Array.from(this.members.values()).filter(m => m.roomId === roomId);
  }

  updateMember(id: string, updates: Partial<Member>): Member | undefined {
    const member = this.members.get(id);
    if (!member) return undefined;

    const updated = { ...member, ...updates };
    this.members.set(id, updated);
    return updated;
  }

  // Plan Packages
  setPlanPackages(roomId: string, packages: PlanPackage[]): void {
    this.planPackages.set(roomId, packages);
  }

  getPlanPackages(roomId: string): PlanPackage[] | undefined {
    return this.planPackages.get(roomId);
  }

  // Trips
  createTrip(trip: Trip): Trip {
    this.trips.set(trip.id, trip);
    return trip;
  }

  getTripByRoom(roomId: string): Trip | undefined {
    return Array.from(this.trips.values()).find(t => t.roomId === roomId);
  }

  updateTrip(id: string, updates: Partial<Trip>): Trip | undefined {
    const trip = this.trips.get(id);
    if (!trip) return undefined;

    const updated = { ...trip, ...updates };
    this.trips.set(id, updated);
    return updated;
  }
}

export const store = new DataStore();
