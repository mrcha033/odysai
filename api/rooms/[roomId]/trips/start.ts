import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { buildConflictReport } from '../../../_lib/preferenceMediator';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const { planId } = req.body;

    const room = await store.getRoom(roomId as string);
    const packages = await store.getPlanPackages(roomId as string);

    if (!room || !packages) {
      return res.status(404).json({ error: 'Room or plans not found' });
    }

    const plan = packages.find(p => p.id === planId);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const members = await store.getRoomMembers(roomId as string);
    if (!members.every(m => m.isReady)) {
      return res.status(400).json({ error: 'Not all members are ready' });
    }

    const conflictReport = buildConflictReport(members);

    const trip = await store.createTrip({
      id: uuidv4(),
      roomId: roomId as string,
      plan,
      status: 'active',
      startDate: room.dateRange.start,
      currentDay: 1,
      conflictReport,
    });

    return res.status(200).json(trip);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
