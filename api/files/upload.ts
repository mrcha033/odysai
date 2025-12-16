import { put } from '@vercel/blob';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withCors } from '../_lib/handler';

export const config = {
    api: {
        bodyParser: false,
    },
};

async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const filename = req.query.filename as string || 'image.jpg';

    try {
        const blob = await put(filename, req, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
        });

        return res.status(200).json(blob);
    } catch (error) {
        console.error('Blob upload failed:', error);
        return res.status(500).json({ error: 'Upload failed', details: (error as Error).message });
    }
}

export default withCors(handler);
