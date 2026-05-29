import { getSupabase } from '../../../utils/supabaseServer';

export default async function handler(req, res) {
  // Only allow GET requests for fetching months
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // 🟢 FIXED: Explicitly listing your actual monthly table names from your Supabase schema.
    // This bypasses the information_schema security error and ignores the master table completely!
    const monthlyTables = [
      'October_2025',
      'Novemebr_2025',   // Matches your exact Supabase spelling typo
      'Decemeber_2025',  // Matches your exact Supabase spelling typo
      'January_2026',
      'February_2026',
      'March_2026',
      'April_2026',
      'May_2026',
      'June_2026',
      'July_2026',
      'August_2026',
      'September_2026',
      'October_2026'
    ];

    // Optional: Sort them logically so they appear nicely in your sidebar dropdown
    monthlyTables.sort((a, b) => {
      const yearA = parseInt(a.split('_')[1]) || 0;
      const yearB = parseInt(b.split('_')[1]) || 0;
      if (yearA !== yearB) return yearA - yearB;
      return a.localeCompare(b);
    });

    // Send the correct object structure your Sidebar.jsx is looking for
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({ sheets: monthlyTables });

  } catch (error) {
    console.error('Error in months API handler:', error);
    return res.status(500).json({ error: error.message, sheets: [] });
  }
}