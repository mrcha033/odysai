import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { aiService } from '../../_lib/aiService';
import { buildConflictReport } from '../../_lib/preferenceMediator';
import { TripReport } from '../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { tripId } = req.query;
  const { method } = req;

  if (method === 'GET') {
    const trip = await store.getTrip(tripId as string);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    return res.status(200).json(trip);
  }

  if (method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const action = req.body?.action as string;
  if (!action) return res.status(400).json({ error: 'action is required' });

  const trip = await store.getTrip(tripId as string);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });

  if (action === 'replace-spot') {
    const { slotId, reason, day } = req.body;
    const dayPlan = trip.plan.days.find(d => d.day === day);
    if (!dayPlan) return res.status(404).json({ error: 'Day not found' });
    const slot = dayPlan.slots.find(s => s.id === slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    const roomMembers = await store.getRoomMembers(trip.roomId);
    const constraints = roomMembers.flatMap(m => m.survey?.constraints || []);
    const dislikes = roomMembers.flatMap(m => m.survey?.dislikes || []);
    const mustHaves = roomMembers.flatMap(m => m.survey?.mustHaves || []);
    const priorityNicknames = roomMembers.filter(m => m.survey?.priority === 'high').map(m => m.nickname);
    const conflictReport = trip.conflictReport || buildConflictReport(roomMembers);
    const instagramImportance = Math.round(
      roomMembers.reduce((acc, member) => acc + (member.survey?.instagramImportance ?? 3), 0) /
      Math.max(roomMembers.length, 1)
    );

    try {
      const alternatives = await aiService.replaceSpot(
        slot,
        reason,
        {
          day,
          location: slot.location,
          themeEmphasis: trip.plan.themeEmphasis,
          constraints,
          dislikes,
          mustHaves,
          priorityNicknames,
          instagramImportance,
          dayPlanSlots: dayPlan.slots,
          consensus: conflictReport.consensus,
          conflicts: conflictReport.conflicts,
        }
      );

      return res.status(200).json(alternatives);
    } catch (error) {
      console.error('Failed to generate alternatives:', error);
      return res.status(500).json({ error: 'Failed to generate alternatives', details: (error as Error).message });
    }
  }

  if (action === 'complete') {
    const { dayEmotions = [], photos = [], feedback = '' } = req.body || {};

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
      // Use the new elaborate report generation if images are present or just as a better default
      const summaryContext = prompt; // Re-use the context string we built
      report = await aiService.generateElaborateTripReport(trip.id, summaryContext, photos);

      // Merge with default structure if AI returns partial
      report = {
        tripId: trip.id,
        summary: report.summary || 'Trip Completed!',
        highlights: report.highlights || [],
        cards: report.cards || [],
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

    const mergedPhotos = Array.from(new Set([...(trip.photos || []), ...photos]));
    await store.updateTrip(trip.id, { status: 'completed', report, photos: mergedPhotos });
    return res.status(200).json(report);
  }

  if (action === 'photo-add') {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ error: 'url is required' });
    const photos = Array.from(new Set([...(trip.photos || []), url]));
    const updated = await store.updateTrip(trip.id, { photos });
    return res.status(200).json({ photos: updated?.photos || photos });
  }

  if (action === 'photo-list') {
    return res.status(200).json({ photos: trip.photos || [] });
  }

  if (action === 'report-image') {
    const city = trip.plan.days[0]?.slots[0]?.location || trip.plan.name || '여행지';
    const highlights = trip.report?.highlights?.join(', ') || '';
    const vibe = trip.plan.name || '여행 테마';

    const prompt = [
      `Create a single postcard-style illustration for a group trip to ${city}.`,
      `Vibe: ${vibe}.`,
      highlights ? `Highlights: ${highlights}.` : '',
      'Use warm, inviting colors. Avoid text on the image. Show people enjoying the trip (no faces needed).',
    ].filter(Boolean).join(' ');

    const referencePhoto = trip.photos && trip.photos.length > 0 ? trip.photos[0] : undefined;

    try {
      const imageData = await aiService.generateReportImage(prompt, referencePhoto);
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

  return res.status(400).json({ error: 'Unsupported action' });
}

export default withCors(handler);
