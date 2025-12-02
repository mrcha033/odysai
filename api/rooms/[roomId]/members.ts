import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/store';
import { Member } from '../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Join room as a member
    const { nickname } = req.body;

    const room = store.getRoom(roomId as string);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const member: Member = {
      id: uuidv4(),
      roomId: roomId as string,
      nickname,
      surveyCompleted: false,
      isReady: false,
    };

    store.addMember(member);
    return res.status(200).json(member);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
