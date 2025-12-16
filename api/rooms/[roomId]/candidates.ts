import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';

async function handler(req: VercelRequest, res: VercelResponse) {
    const { roomId } = req.query;
    const { method } = req;
    const { candidate } = req.body || {};

    if (!roomId) {
        return res.status(400).json({ error: 'Room ID required' });
    }

    if (method === 'POST') {
        if (!candidate || typeof candidate !== 'string') {
            return res.status(400).json({ error: 'Candidate name required' });
        }
        const updatedList = await store.addRoomCandidate(roomId as string, candidate.trim());
        return res.status(200).json({ candidates: updatedList });
    }

    if (method === 'DELETE') {
        if (!candidate || typeof candidate !== 'string') {
            return res.status(400).json({ error: 'Candidate name required' });
        }
        const updatedList = await store.removeRoomCandidate(roomId as string, candidate.trim());
        return res.status(200).json({ candidates: updatedList });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
