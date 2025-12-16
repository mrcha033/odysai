import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { searchService } from '../../_lib/searchService';

async function handler(req: VercelRequest, res: VercelResponse) {
    const { roomId } = req.query;
    const { method } = req;

    if (!roomId) {
        return res.status(400).json({ error: 'Room ID required' });
    }

    if (method === 'POST') {
        const room = await store.getRoom(roomId as string);
        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        const results = await searchService.searchPlaces(room.city);
        return res.status(200).json({ results });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
