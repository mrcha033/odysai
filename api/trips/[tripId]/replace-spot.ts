import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { aiService } from '../../_lib/aiService';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { tripId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Replace a spot in the trip
    const { slotId, reason, day } = req.body;

    const trip = await store.getTrip(tripId as string);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const dayPlan = trip.plan.days.find((d: any) => d.day === day);
    if (!dayPlan) {
      return res.status(404).json({ error: 'Day not found' });
    }

    const slot = dayPlan.slots.find((s: any) => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    try {
      const roomMembers = await store.getRoomMembers(trip.roomId);
      const constraints = roomMembers.flatMap(m => m.survey?.constraints || []);
      const dislikes = roomMembers.flatMap(m => m.survey?.dislikes || []);
      const mustHaves = roomMembers.flatMap(m => m.survey?.mustHaves || []);
      const priorityNicknames = roomMembers.filter(m => m.survey?.priority === 'high').map(m => m.nickname);
      const conflictReport = trip.conflictReport || null;
      const instagramImportance = Math.round(
        roomMembers.reduce((acc, member) => acc + (member.survey?.instagramImportance ?? 3), 0) /
        Math.max(roomMembers.length, 1)
      );

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
          consensus: conflictReport?.consensus,
          conflicts: conflictReport?.conflicts,
        }
      );

      return res.status(200).json(alternatives);
    } catch (error) {
      console.error('Failed to generate alternatives:', error);
      return res.status(500).json({
        error: 'Failed to generate alternatives',
        details: (error as Error).message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
