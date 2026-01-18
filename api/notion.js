import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // ၁။ POST မဟုတ်ရင် လက်မခံဘူး
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ၂။ API Key တွေကို Header ကနေ ယူမယ်
    const apiKey = req.headers['x-notion-token'];
    const databaseId = req.headers['x-database-id'];

    if (!apiKey || !databaseId) {
      return res.status(401).json({ error: 'Missing Notion API Key or Database ID' });
    }

    // ၃။ Body ထဲက Data ကို ယူမယ်
    const { text, mood, date } = req.body;

    if (!text || !mood || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ၄။ Notion Client ကို စမယ်
    const notion = new Client({ auth: apiKey });

    // ၅။ Notion Database ထဲ ထည့်မယ်
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

    // ၆။ အောင်မြင်ကြောင်း ပြန်ပြောမယ်
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('Notion API Error:', error);
    // Error အကြောင်းရင်းကို အတိအကျ ပြန်ပို့မယ်
    return res.status(500).json({ 
      error: 'Failed to sync with Notion', 
      details: error.message 
    });
  }
}