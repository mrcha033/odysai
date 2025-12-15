import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { PlanPackage, DayPlan, ActivitySlot } from '../../../_lib/types';

function mergePlan(original: PlanPackage, updates: Partial<PlanPackage>): PlanPackage {
  const updated = { ...original, ...updates };
  if (updates.days) {
    updated.days = updates.days.map((dayUpdate: DayPlan) => {
      const originalDay = original.days.find(d => d.day === dayUpdate.day) || dayUpdate;
      return { ...originalDay, ...dayUpdate };
    });
  }
  return updated;
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const { planId, updates } = req.body as { planId: string; updates: Partial<PlanPackage> };
    if (!planId || !updates) {
      return res.status(400).json({ error: 'planId and updates are required' });
    }

    const plans = await store.getPlanPackages(roomId as string);
    if (!plans) return res.status(404).json({ error: 'No plans found' });
    const idx = plans.findIndex(p => p.id === planId);
    if (idx === -1) return res.status(404).json({ error: 'Plan not found' });

    const merged = mergePlan(plans[idx], updates);
    plans[idx] = merged;
    await store.setPlanPackages(roomId as string, plans);
    return res.status(200).json(merged);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
