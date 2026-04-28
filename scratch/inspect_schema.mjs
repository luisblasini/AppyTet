import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function inspectSchema() {
  console.log("--- INSPECTING BOOKINGS TABLE ---");
  const { data: bData, error: bError } = await supabase.from('bookings').select('*').limit(1);
  if (bError) {
    console.error("Error bookings:", bError.message);
  } else {
    console.log("Columns in 'bookings':", bData.length > 0 ? Object.keys(bData[0]) : "Table empty or unreachable");
  }

  console.log("\n--- INSPECTING BOOKING_ITEMS TABLE ---");
  const { data: iData, error: iError } = await supabase.from('booking_items').select('*').limit(1);
  if (iError) {
    console.error("Error booking_items:", iError.message);
  } else {
    console.log("Columns in 'booking_items':", iData.length > 0 ? Object.keys(iData[0]) : "Table empty or unreachable");
  }
}

inspectSchema();
