import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../../_lib/handler';
import { store } from '../../_lib/store';
import { Survey } from '../../_lib/types';

async function handler(req: VercelRequest, res: VercelResponse) {
  const { memberId } = req.query;
  const { method } = req;

  if (method === 'POST') {
    // Submit survey
    const survey: Survey = req.body;

    const member = store.getMember(memberId as string);
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const updated = store.updateMember(memberId as string, {
      survey,
      surveyCompleted: true,
    });

    return res.status(200).json(updated);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export default withCors(handler);
