import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/store';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'GET') {
    // Get plan packages for a room
    const packages = store.getPlanPackages(roomId as string);

    if (!packages) {
      return res.status(404).json({ error: 'No plans generated yet' });
    }

    return res.status(200).json(packages);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
