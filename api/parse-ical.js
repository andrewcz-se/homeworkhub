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

        // 2. Date Filter: Only allow events that end today or in the future
        // Use End date if available, otherwise Start date
        const endDate = event.end ? new Date(event.end) : (event.start ? new Date(event.start) : null);
        
        if (endDate) {
             return endDate >= today;
        }
        return false; // Skip events with no date
      })
      .flatMap(event => {
        if (!event.start) return [];

        const start = new Date(event.start);
        const end = event.end ? new Date(event.end) : new Date(start);
        
        // Handle case where end < start (invalid data protection)
        if (end < start) {
            end.setTime(start.getTime()); 
        }

        const eventsList = [];
        
        // Create a cursor starting at the beginning of the start day (UTC to match ISO string logic)
        // We iterate by day.
        let cursor = new Date(start);
        cursor.setUTCHours(0, 0, 0, 0); // Normalize to UTC midnight

        // Safety break
        let loopCount = 0;
        
        // Loop while cursor is before the end date
        // If end is exactly midnight (e.g. Feb 4 00:00), cursor (Feb 4 00:00) is NOT < end. Loop stops. Feb 4 not included. Correct.
        // If end is Feb 4 10:00, cursor (Feb 4 00:00) IS < end. Loop continues. Feb 4 included. Correct.
        while (cursor < end && loopCount < 365) {
            
            const dateString = cursor.toISOString().split('T')[0];
            
            eventsList.push({
              taskName: event.summary || 'Untitled Task',
              dueDate: dateString,
              description: event.description || '',
              location: event.location || '',
              categories: event.categories || [], 
              uid: event.uid,
            });

            // Advance cursor by 1 day
            cursor.setUTCDate(cursor.getUTCDate() + 1);
            loopCount++;
        }
        
        // Fallback for 0-duration events or if loop didn't run
        if (eventsList.length === 0) {
             const dateString = start.toISOString().split('T')[0];
             eventsList.push({
              taskName: event.summary || 'Untitled Task',
              dueDate: dateString,
              description: event.description || '',
              location: event.location || '',
              categories: event.categories || [], 
              uid: event.uid,
            });
        }

        return eventsList;
      })
      .filter(task => {
          // Compare task.dueDate with today's date string (UTC comparison)
          const todayString = today.toISOString().split('T')[0];
          return task.dueDate >= todayString;
      });

    console.log(`--- Parsed ${events.length} events (Filtered for Future) ---`);
    res.status(200).json({ events });
  } catch (error) {
    console.error("iCal Parse Error:", error);
    res.status(500).json({ error: 'Failed to parse calendar URL' });
  }
}