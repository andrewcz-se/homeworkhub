import ical from 'node-ical';

export default async function handler(req, res) {
  // enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    console.log("--- Fetching iCal from:", url);
    const data = await ical.async.fromURL(url);
    
    // Define "Today" (Start of day to ensure today's tasks are included)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = Object.values(data)
      .filter(event => {
        // 1. Ensure it is an event
        if (event.type !== 'VEVENT') return false;

        // 2. Date Filter: Only allow events starting today or in the future
        if (event.start) {
            const eventDate = new Date(event.start);
            // Keep if the event is after or equal to today (00:00)
            return eventDate >= today;
        }
        return false; // Skip events with no start date
      })
      .map(event => {
        // --- DEBUGGING LOG TO FIND WHERE TODDLE DATA IS---
        //console.log(`\n--- Processing Event: ${event.summary} ---`);
        //console.log("Description:", event.description);
        //console.log("Location:", event.location);
        //console.log("Categories:", event.categories);
        //console.log("Full Raw Object Keys:", Object.keys(event));
        // ---------------------

        const startDate = event.start ? new Date(event.start) : new Date();
        const dateString = startDate.toISOString().split('T')[0];

        return {
          taskName: event.summary || 'Untitled Task',
          dueDate: dateString,
          description: event.description || '',
          location: event.location || '',
          categories: event.categories || [], 
          uid: event.uid,
        };
      });

    console.log(`--- Parsed ${events.length} events (Filtered for Future) ---`);
    res.status(200).json({ events });
  } catch (error) {
    console.error("iCal Parse Error:", error);
    res.status(500).json({ error: 'Failed to parse calendar URL' });
  }
}