import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { aiService } from '../../_lib/aiService';
import { TripReport } from '../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { tripId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const trip = await store.getTrip(tripId as string);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const city = trip.plan.days[0]?.slots[0]?.location || trip.plan.name || '여행지';
    const highlights = trip.report?.highlights?.join(', ') || '';
    const vibe = trip.plan.name || '여행 테마';

    const prompt = [
      `Create a single postcard-style illustration for a group trip to ${city}.`,
      `Vibe: ${vibe}.`,
      highlights ? `Highlights: ${highlights}.` : '',
      'Use warm, inviting colors. Avoid text on the image. Show people enjoying the trip (no faces needed).',
    ].filter(Boolean).join(' ');

    try {
      const imageData = await aiService.generateReportImage(prompt);
      const updatedReport: TripReport = {
        tripId: trip.id,
        summary: trip.report?.summary || trip.plan.name || 'Trip Report',
        highlights: trip.report?.highlights || [],
        cards: trip.report?.cards || [],
        shareUrl: trip.report?.shareUrl,
        heroImageData: imageData,
      };
      await store.updateTrip(trip.id, { report: updatedReport });
      return res.status(200).json({ imageData });
    } catch (error) {
      console.error('Failed to generate report image:', error);
      return res.status(500).json({ error: 'Failed to generate image', details: (error as Error).message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
