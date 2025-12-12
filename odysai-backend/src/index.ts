import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import { aiService } from './aiService';
import { Room, Member, Survey, RoomStatus, PlanPackage } from './types';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Create a new room
app.post('/api/rooms', (req, res) => {
  const { city, dateRange, theme, travelerCount } = req.body;

  const room: Room = {
    id: uuidv4(),
    city,
    dateRange,
    theme,
    travelerCount,
    createdAt: new Date().toISOString(),
  };

  store.createRoom(room);
  res.json(room);
});

// Get room status
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = store.getRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const members = store.getRoomMembers(roomId);
  const allReady = members.length > 0 && members.every(m => m.isReady);
  const planPackages = store.getPlanPackages(roomId);
  const trip = store.getTripByRoom(roomId);

  const status: RoomStatus = {
    room,
    members,
    allReady,
    planPackages,
    trip,
  };

  res.json(status);
});

// Join room as a member
app.post('/api/rooms/:roomId/members', (req, res) => {
  const { roomId } = req.params;
  const { nickname } = req.body;

  const room = store.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const member: Member = {
    id: uuidv4(),
    roomId,
    nickname,
    surveyCompleted: false,
    isReady: false,
  };

  store.addMember(member);
  res.json(member);
});

// Submit survey
app.post('/api/members/:memberId/survey', (req, res) => {
  const { memberId } = req.params;
  const survey: Survey = req.body;

  const member = store.getMember(memberId);
  if (!member) {
    return res.status(404).json({ error: 'Member not found' });
  }

  const updated = store.updateMember(memberId, {
    survey,
    surveyCompleted: true,
  });

  res.json(updated);
});

// Generate initial AI plans (Gemini-backed)
app.post('/api/rooms/:roomId/plans/generate', async (req, res) => {
  const { roomId } = req.params;

  const room = store.getRoom(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  const members = store.getRoomMembers(roomId);
  const membersWithSurveys = members.filter(m => m.survey);

  if (membersWithSurveys.length === 0) {
    return res.status(400).json({ error: 'No surveys completed yet' });
  }

  try {
    const packages = await aiService.generateInitialPackages(
      room,
      membersWithSurveys.map(m => m.survey!)
    );

    store.setPlanPackages(roomId, packages);
    res.json(packages);
  } catch (error) {
    console.error('Failed to generate plans:', error);
    res.status(500).json({ error: 'Failed to generate plans', details: (error as Error).message });
  }
});

// Get plan packages for a room
app.get('/api/rooms/:roomId/plans', (req, res) => {
  const { roomId } = req.params;
  const packages = store.getPlanPackages(roomId);

  if (!packages) {
    return res.status(404).json({ error: 'No plans generated yet' });
  }

  res.json(packages);
});

// Select a plan package
app.post('/api/rooms/:roomId/plans/select', (req, res) => {
  const { roomId } = req.params;
  const { planId } = req.body;

  const packages = store.getPlanPackages(roomId);
  if (!packages) {
    return res.status(404).json({ error: 'No plans available' });
  }

  const selectedPlan = packages.find(p => p.id === planId);
  if (!selectedPlan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  res.json(selectedPlan);
});

// Update member ready status
app.post('/api/members/:memberId/ready', (req, res) => {
  const { memberId } = req.params;
  const { isReady } = req.body;

  const updated = store.updateMember(memberId, { isReady });

  if (!updated) {
    return res.status(404).json({ error: 'Member not found' });
  }

  res.json(updated);
});

// Start trip (when all ready)
app.post('/api/rooms/:roomId/trips/start', (req, res) => {
  const { roomId } = req.params;
  const { planId } = req.body;

  const room = store.getRoom(roomId);
  const packages = store.getPlanPackages(roomId);

  if (!room || !packages) {
    return res.status(404).json({ error: 'Room or plans not found' });
  }

  const plan = packages.find(p => p.id === planId);
  if (!plan) {
    return res.status(404).json({ error: 'Plan not found' });
  }

  const members = store.getRoomMembers(roomId);
  if (!members.every(m => m.isReady)) {
    return res.status(400).json({ error: 'Not all members are ready' });
  }

  const trip = store.createTrip({
    id: uuidv4(),
    roomId,
    plan,
    status: 'active',
    startDate: room.dateRange.start,
    currentDay: 1,
  });

  res.json(trip);
});

// Replace a spot in the trip (Gemini-backed)
app.post('/api/trips/:tripId/replace-spot', async (req, res) => {
  const { tripId } = req.params;
  const { slotId, reason, day } = req.body;

  const trip = store.getTrip(tripId);
  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  const dayPlan = trip.plan.days.find((d: any) => d.day === day);
  if (!dayPlan) {
    return res.status(404).json({ error: 'Day not found' });
  }

  const slot = dayPlan.slots.find((s: any) => s.id === slotId);
  if (!slot) {
    return res.status(404).json({ error: 'Slot not found' });
  }

  try {
    const roomMembers = store.getRoomMembers(trip.roomId);
    const constraints = roomMembers.flatMap(m => m.survey?.constraints || []);
    const dislikes = roomMembers.flatMap(m => m.survey?.dislikes || []);
    const instagramImportance = Math.round(
      roomMembers.reduce((acc, member) => acc + (member.survey?.instagramImportance ?? 3), 0) /
      Math.max(roomMembers.length, 1)
    );

    const alternatives = await aiService.replaceSpot(
      slot,
      reason,
      {
        day,
        location: slot.location,
        themeEmphasis: trip.plan.themeEmphasis,
        constraints,
        dislikes,
        instagramImportance,
        dayPlanSlots: dayPlan.slots,
      }
    );

    res.json(alternatives);
  } catch (error) {
    console.error('Failed to generate alternatives:', error);
    res.status(500).json({ error: 'Failed to generate alternatives', details: (error as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Ody'sai Backend running on http://localhost:${PORT}`);
  console.log(`🤖 AI provider: Gemini (${process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest'})`);
});
