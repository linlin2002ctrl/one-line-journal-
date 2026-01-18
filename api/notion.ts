import { Client } from '@notionhq/client';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = req.headers['x-notion-token'];
  const databaseId = req.headers['x-database-id'];

  if (!apiKey || !databaseId) {
    return res.status(401).json({ error: 'Missing Notion API Key or Database ID' });
  }

  const { text, mood, date } = req.body;

  if (!text || !mood || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const notion = new Client({ auth: apiKey });

    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        'Journal Entry': {
          title: [
            {
              text: {
                content: text,
              },
            },
          ],
        },
        'Mood': {
          select: {
            name: mood,
          },
        },
        'Date': {
          date: {
            start: date,
          },
        },
      },
    });

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Notion API Error:', error);
    return res.status(500).json({ error: 'Failed to sync with Notion', details: error.message });
  }
}