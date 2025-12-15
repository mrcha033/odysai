import { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/kvStore';
import { Member, Survey } from '../../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.body?.action as string;
  if (!action) return res.status(400).json({ error: 'action is required' });

  if (action === 'join') {
    const { nickname } = req.body;
    const room = await store.getRoom(roomId as string);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const member: Member = {
      id: uuidv4(),
      roomId: roomId as string,
      nickname,
      surveyCompleted: false,
      isReady: false,
    };

    await store.addMember(member);
    return res.status(200).json(member);
  }

  if (action === 'survey') {
    const { memberId, survey } = req.body as { memberId: string; survey: Survey };
    const member = await store.getMember(memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    const updated = await store.updateMember(memberId, {
      survey,
      surveyCompleted: true,
    });
    return res.status(200).json(updated);
  }

  if (action === 'ready') {
    const { memberId, isReady } = req.body;
    const updated = await store.updateMember(memberId, { isReady });
    if (!updated) return res.status(404).json({ error: 'Member not found' });
    return res.status(200).json(updated);
  }

  return res.status(400).json({ error: 'Unsupported action' });
}

export default withCors(handler);
