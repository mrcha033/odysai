import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { PlanVotes } from '../../../_lib/types';

function computeWinner(votes: PlanVotes): string | undefined {
  const entries = Object.entries(votes.tallies || {});
  if (!entries.length) return undefined;
  const max = Math.max(...entries.map(([, n]) => n));
  const candidates = entries.filter(([, n]) => n === max).map(([id]) => id);
  if (candidates.length === 1) return candidates[0];
  // Tie-breaker: keep prior winner if still tied, else pick first candidate alphabetically for determinism
  if (votes.winnerPlanId && candidates.includes(votes.winnerPlanId)) {
    return votes.winnerPlanId;
  }
  return candidates.sort()[0];
}

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

    existing.winnerPlanId = computeWinner(existing);

    await store.setVotes(roomId as string, existing);
    return res.status(200).json(existing);
  }

  if (method === 'GET') {
    const votes = await store.getVotes(roomId as string);
    if (votes) {
      votes.winnerPlanId = computeWinner(votes);
    }
    return res.status(200).json(votes || { tallies: {}, voters: {}, winnerPlanId: undefined });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
