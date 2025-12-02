import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../../_lib/handler';
import { store } from '../../../_lib/store';
import { n8nService } from '../../../_lib/n8nService';
import { aiService } from '../../../_lib/aiService';
import { PlanPackage } from '../../../_lib/types';

// Helper function
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
}

async function handler(req: VercelRequest, res: VercelResponse) {
  const { roomId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Generate initial AI plans
    const room = store.getRoom(roomId as string);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const members = store.getRoomMembers(roomId as string);
    const membersWithSurveys = members.filter(m => m.survey);

    if (membersWithSurveys.length === 0) {
      return res.status(400).json({ error: 'No surveys completed yet' });
    }

    try {
      let packages: PlanPackage[] = [];

      try {
        // Call n8n plan-initialize workflow
        const n8nResult = await n8nService.generateInitialPackages(
          room,
          membersWithSurveys.map(m => m.survey!),
          membersWithSurveys.map(m => ({ id: m.id, nickname: m.nickname }))
        );

        // Convert n8n response to our PlanPackage format
        packages = n8nResult.packages.map(pkg => ({
          id: pkg.id,
          roomId: roomId as string,
          name: pkg.label,
          description: pkg.description,
          days: pkg.days.map((day, index) => ({
            day: index + 1,
            date: day.date,
            slots: day.slots.map(slot => ({
              id: slot.id,
              time: slot.startTime,
              duration: calculateDuration(slot.startTime, slot.endTime),
              title: slot.place.name,
              description: slot.place.notes,
              location: slot.place.city,
              category: slot.place.category,
              tags: slot.place.tags,
            })),
          })),
          themeEmphasis: pkg.scoreSummary ? [pkg.scoreSummary.substring(0, 30)] : [],
        }));
      } catch (error) {
        console.warn('⚠️ n8n service failed, falling back to mock AI:', (error as Error).message);
        packages = await aiService.generateInitialPackages(
          room,
          membersWithSurveys.map(m => m.survey!)
        );
      }

      store.setPlanPackages(roomId as string, packages);
      return res.status(200).json(packages);
    } catch (error) {
      console.error('Failed to generate plans:', error);
      return res.status(500).json({
        error: 'Failed to generate plans',
        details: (error as Error).message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
