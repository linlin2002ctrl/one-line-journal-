// api/notion.js
import { Client } from '@notionhq/client';

export default async function handler(req, res) {
  // ၁။ API Key စစ်ဆေးခြင်း
  const apiKey = req.headers['x-notion-token'];
  const databaseId = req.headers['x-database-id'];

  if (!apiKey || !databaseId) {
    return res.status(401).json({ error: 'Missing API Key or Database ID' });
  }

  const notion = new Client({ auth: apiKey });

  try {
    // === အပိုင်း (က) - စာပို့ခြင်း (POST) ===
    if (req.method === 'POST') {
      const { text, mood, date } = req.body;
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          'Journal Entry': { title: [{ text: { content: text } }] },
          'Mood': { select: { name: mood } },
          'Date': { date: { start: date } },
        },
      });
      return res.status(200).json({ success: true });
    }

    // === အပိုင်း (ခ) - စာပြန်ယူခြင်း (GET) ===
    else if (req.method === 'GET') {
      const response = await notion.databases.query({
        database_id: databaseId,
        sorts: [{ property: 'Date', direction: 'descending' }], // ရက်စွဲနဲ့ စီမယ်
      });

      // Notion ရဲ့ ရှုပ်ထွေးတဲ့ Data တွေကို ရိုးရိုးရှင်းရှင်း ပြောင်းမယ်
      const formattedData = response.results.map((page) => {
        return {
          id: page.id,
          text: page.properties['Journal Entry']?.title[0]?.plain_text || 'No Title',
          mood: page.properties['Mood']?.select?.name || 'Neutral',
          date: page.properties['Date']?.date?.start || '',
        };
      });

      return res.status(200).json(formattedData);
    }

    // အခြား Method တွေ လက်မခံဘူး
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}