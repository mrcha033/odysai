import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/store';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Select a plan package
    const { planId } = req.body;

    const packages = store.getPlanPackages(roomId as string);
    if (!packages) {
      return res.status(404).json({ error: 'No plans available' });
    }

    const selectedPlan = packages.find(p => p.id === planId);
    if (!selectedPlan) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    return res.status(200).json(selectedPlan);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
