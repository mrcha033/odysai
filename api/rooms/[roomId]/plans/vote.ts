import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { PlanVotes } from '../../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const { memberId, planId } = req.body;
    if (!memberId || !planId) {
      return res.status(400).json({ error: 'memberId and planId are required' });
    }

    const members = await store.getRoomMembers(roomId as string);
    if (!members.find(m => m.id === memberId)) {
      return res.status(404).json({ error: 'Member not found in room' });
    }

    const plans = await store.getPlanPackages(roomId as string);
    if (!plans || !plans.find(p => p.id === planId)) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const existing: PlanVotes = (await store.getVotes(roomId as string)) || { tallies: {}, voters: {} };
    const prevPlan = existing.voters[memberId];
    if (prevPlan) {
      existing.tallies[prevPlan] = Math.max(0, (existing.tallies[prevPlan] || 1) - 1);
    }
    existing.voters[memberId] = planId;
    existing.tallies[planId] = (existing.tallies[planId] || 0) + 1;

    await store.setVotes(roomId as string, existing);
    return res.status(200).json(existing);
  }

  if (method === 'GET') {
    const votes = await store.getVotes(roomId as string);
    return res.status(200).json(votes || { tallies: {}, voters: {} });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
