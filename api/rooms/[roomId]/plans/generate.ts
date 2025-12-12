import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { aiService } from '../../../_lib/aiService';
import { PlanPackage } from '../../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Generate initial AI plans
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
      const packages: PlanPackage[] = await aiService.generateInitialPackages(
        room,
        membersWithSurveys.map(m => m.survey!)
      );

      await store.setPlanPackages(roomId as string, packages);
      return res.status(200).json(packages);
    } catch (error) {
      console.error('Failed to generate plans:', error);
      return res.status(500).json({
        error: 'Failed to generate plans',
        details: (error as Error).message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
