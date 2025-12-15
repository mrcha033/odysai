import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { buildConflictReport } from '../../../_lib/preferenceMediator';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'GET') {
    const room = await store.getRoom(roomId as string);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const members = await store.getRoomMembers(roomId as string);
    const report = buildConflictReport(members);
    return res.status(200).json(report);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
