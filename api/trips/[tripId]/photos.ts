import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { tripId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url is required' });

    const trip = await store.getTrip(tripId as string);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const photos = Array.from(new Set([...(trip.photos || []), url]));
    const updated = await store.updateTrip(trip.id, { photos });
    return res.status(200).json({ photos: updated?.photos || photos });
  }

  if (method === 'GET') {
    const trip = await store.getTrip(tripId as string);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    return res.status(200).json({ photos: trip.photos || [] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
