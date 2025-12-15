import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { aiService } from '../../_lib/aiService';
import { buildConflictReport, scorePlan, buildPreferenceProfiles } from '../../_lib/preferenceMediator';
import { PlanPackage, PlanVotes } from '../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'GET') {
    const packages = await store.getPlanPackages(roomId as string);
    if (!packages) {
      return res.status(404).json({ error: 'No plans generated yet' });
    }
    return res.status(200).json(packages);
  }

  if (method === 'POST') {
    const action = req.body?.action as string;
    if (!action) return res.status(400).json({ error: 'action is required' });

    if (action === 'generate') {
      const room = await store.getRoom(roomId as string);
      if (!room) return res.status(404).json({ error: 'Room not found' });

      const members = await store.getRoomMembers(roomId as string);
      const membersWithSurveys = members.filter(m => m.survey);
      if (membersWithSurveys.length === 0) {
        return res.status(400).json({ error: 'No surveys completed yet' });
      }

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
      const existingTrip = await store.getTripByRoom(roomId as string);
      if (existingTrip) {
        await store.updateTrip(existingTrip.id, { conflictReport });
      }
      return res.status(200).json(scored);
    }

    if (action === 'select') {
      const { planId } = req.body;
      const packages = await store.getPlanPackages(roomId as string);
      if (!packages) return res.status(404).json({ error: 'No plans available' });
      const selected = packages.find(p => p.id === planId);
      if (!selected) return res.status(404).json({ error: 'Plan not found' });
      return res.status(200).json(selected);
    }

    if (action === 'vote') {
      const { memberId, planId } = req.body;
      if (!memberId || !planId) return res.status(400).json({ error: 'memberId and planId are required' });

      const members = await store.getRoomMembers(roomId as string);
      if (!members.find(m => m.id === memberId)) return res.status(404).json({ error: 'Member not found in room' });

      const plans = await store.getPlanPackages(roomId as string);
      if (!plans || !plans.find(p => p.id === planId)) return res.status(404).json({ error: 'Plan not found' });

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

    if (action === 'votes') {
      const votes = await store.getVotes(roomId as string);
      if (votes) {
        votes.winnerPlanId = computeWinner(votes);
      }
      return res.status(200).json(votes || { tallies: {}, voters: {}, winnerPlanId: undefined });
    }

    if (action === 'update') {
      const { planId, updates } = req.body as { planId: string; updates: Partial<PlanPackage> };
      if (!planId || !updates) return res.status(400).json({ error: 'planId and updates are required' });

      const plans = await store.getPlanPackages(roomId as string);
      if (!plans) return res.status(404).json({ error: 'No plans found' });
      const idx = plans.findIndex(p => p.id === planId);
      if (idx === -1) return res.status(404).json({ error: 'Plan not found' });

      const merged = mergePlan(plans[idx], updates);
      plans[idx] = merged;
      await store.setPlanPackages(roomId as string, plans);
      return res.status(200).json(merged);
    }

    return res.status(400).json({ error: 'Unsupported action' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

function mergePlan(original: PlanPackage, updates: Partial<PlanPackage>): PlanPackage {
  const updated = { ...original, ...updates };
  if (updates.days) {
    updated.days = updates.days.map((dayUpdate: any) => {
      const originalDay = original.days.find(d => d.day === dayUpdate.day) || dayUpdate;
      return { ...originalDay, ...dayUpdate };
    });
  }
  return updated;
}

function computeWinner(votes: PlanVotes): string | undefined {
  const entries = Object.entries(votes.tallies || {});
  if (!entries.length) return undefined;
  const max = Math.max(...entries.map(([, n]) => n));
  const candidates = entries.filter(([, n]) => n === max).map(([id]) => id);
  if (candidates.length === 1) return candidates[0];
  if (votes.winnerPlanId && candidates.includes(votes.winnerPlanId)) {
    return votes.winnerPlanId;
  }
  return candidates.sort()[0];
}

export default withCors(handler);
