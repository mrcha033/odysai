import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/kvStore';
import { n8nService } from '../../_lib/n8nService';
import { aiService } from '../../_lib/aiService';

// Helper functions
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

function addMinutes(time: string, minutes: number): string {
  const [hour, min] = time.split(':').map(Number);
  const totalMinutes = hour * 60 + min + minutes;
  const newHour = Math.floor(totalMinutes / 60);
  const newMin = totalMinutes % 60;
  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}

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
      // Prepare n8n input
      const n8nInput = {
        tripId: tripId as string,
        date: dayPlan.date,
        slotToReplace: {
          id: slot.id,
          startTime: slot.time,
          endTime: addMinutes(slot.time, slot.duration),
          place: {
            id: slot.id,
            name: slot.title,
            category: slot.category,
            city: slot.location,
            tags: slot.tags,
            notes: slot.description,
          },
        },
        reason: reason.toUpperCase(),
        context: {
          currentCity: slot.location,
          timeNow: slot.time,
          weather: 'UNKNOWN' as const,
          budgetLevel: 'MID' as const,
          dominantEmotions: trip.plan.themeEmphasis || [],
          instagramImportanceAvg: 5,
          sameAreaHint: null,
        },
        dayPlan: {
          date: dayPlan.date,
          slots: dayPlan.slots.map((s: any) => ({
            startTime: s.time,
            endTime: addMinutes(s.time, s.duration),
            place: {
              name: s.title,
              category: s.category,
              city: s.location,
              tags: s.tags,
            },
          })),
        },
      };

      let alternatives;

      try {
        const n8nResult = await n8nService.replaceSpot(n8nInput);

        // Convert n8n replacements to our ActivitySlot format
        alternatives = n8nResult.replacements.map(replacement => ({
          id: replacement.id,
          time: replacement.suggestedTime.startTime,
          duration: calculateDuration(replacement.suggestedTime.startTime, replacement.suggestedTime.endTime),
          title: replacement.name,
          description: replacement.reasonSummary,
          location: replacement.city,
          category: replacement.category,
          tags: replacement.tags,
        }));
      } catch (error) {
        console.warn('⚠️ n8n service failed, falling back to mock AI:', (error as Error).message);
        alternatives = await aiService.replaceSpot(
          slot,
          reason,
          { day, location: slot.location }
        );
      }

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
