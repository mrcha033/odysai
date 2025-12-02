import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { withCors } from './_lib/handler';
import { store } from './_lib/kvStore';
import { Room } from './_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { method } = req;

  if (method === 'POST') {
    // Create a new room
    const { city, dateRange, theme, travelerCount } = req.body;

    const room: Room = {
      id: uuidv4(),
      city,
      dateRange,
      theme,
      travelerCount,
      createdAt: new Date().toISOString(),
    };

    await store.createRoom(room);
    return res.status(200).json(room);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
