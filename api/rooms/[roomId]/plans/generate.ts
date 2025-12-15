import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { aiService } from '../../../_lib/aiService';
import { buildConflictReport, scorePlan, buildPreferenceProfiles } from '../../../_lib/preferenceMediator';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const room = await store.getRoom(roomId as string);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const members = await store.getRoomMembers(roomId as string);
    const membersWithSurveys = members.filter(m => m.survey);

    if (membersWithSurveys.length === 0) {
      return res.status(400).json({ error: 'No surveys completed yet' });
    }

    try {
      const conflictReport = buildConflictReport(members);
      const profiles = buildPreferenceProfiles(members);

      const packages = await aiService.generateInitialPackages(
        room,
        membersWithSurveys.map(m => m.survey!),
        { conflict: conflictReport, profiles }
      );

      const scored = packages.map(pkg => ({
        ...pkg,
        fitScore: scorePlan(pkg, membersWithSurveys),
      }));

      await store.setPlanPackages(roomId as string, scored);

      // Attach latest conflict report to trip placeholder if exists
      const existingTrip = await store.getTripByRoom(roomId as string);
      if (existingTrip) {
        await store.updateTrip(existingTrip.id, { conflictReport });
      }

      return res.status(200).json(scored);
    } catch (error) {
      console.error('Failed to generate plans:', error);
      return res.status(500).json({ error: 'Failed to generate plans', details: (error as Error).message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
