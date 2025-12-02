import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/store';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { memberId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Update member ready status
    const { isReady } = req.body;

    const updated = store.updateMember(memberId as string, { isReady });

    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }

    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
