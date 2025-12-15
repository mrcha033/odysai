import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { aiService } from '../../_lib/aiService';
import { TripReport } from '../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { tripId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    const { dayEmotions = [], photos = [], feedback = '' } = req.body || {};

    const trip = await store.getTrip(tripId as string);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Lightweight story generation using existing aiService (fallback-safe)
    const prompt = [
      'Create a short trip report as JSON for a completed group trip.',
      `Destination: ${trip.plan.days[0]?.slots[0]?.location || '여행지'}. Days: ${trip.plan.days.length}.`,
      `Itinerary summary: ${trip.plan.days.map(d => `Day ${d.day}: ${d.slots.map(s => s.title).join(', ')}`).join(' | ')}`,
      dayEmotions.length ? `Daily emotions: ${dayEmotions.join(', ')}` : 'Daily emotions: not provided.',
      feedback ? `Group feedback: ${feedback}` : 'Group feedback: none.',
      photos.length ? `Photos count: ${photos.length}` : 'Photos: none.',
      'Return JSON: { summary: string, highlights: string[], cards: [{ title, body, tags, day? }] }',
    ].join('\n');

    let report: TripReport = {
      tripId: trip.id,
      summary: 'Trip completed',
      highlights: [],
      cards: [],
    };

    try {
      const raw = await aiService.generateStructuredJSON<any>(prompt, {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          highlights: { type: 'array', items: { type: 'string' } },
          cards: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                body: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                day: { type: 'number' },
              },
              required: ['title', 'body'],
            },
          },
        },
        required: ['summary', 'highlights', 'cards'],
      });
      report = {
        tripId: trip.id,
        summary: raw.summary || report.summary,
        highlights: raw.highlights || [],
        cards: raw.cards || [],
      };
    } catch (error) {
      console.warn('Report generation fallback used:', (error as Error).message);
      report.highlights = ['즐거운 추억을 남겼어요!', '다음 여행도 함께해요!'];
      report.cards = trip.plan.days.map(day => ({
        title: `Day ${day.day} 리뷰`,
        body: day.slots.map(s => s.title).join(', '),
        tags: ['auto'],
        day: day.day,
      }));
    }

    await store.updateTrip(trip.id, { status: 'completed', report });
    return res.status(200).json(report);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
