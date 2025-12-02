import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../_lib/handler';
import { store } from '../_lib/store';
import { RoomStatus } from '../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'GET') {
    // Get room status
    const room = store.getRoom(roomId as string);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const members = store.getRoomMembers(roomId as string);
    const allReady = members.length > 0 && members.every(m => m.isReady);
    const planPackages = store.getPlanPackages(roomId as string);
    const trip = store.getTripByRoom(roomId as string);

    const status: RoomStatus = {
      room,
      members,
      allReady,
      planPackages,
      trip,
    };

    return res.status(200).json(status);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
