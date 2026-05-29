import RecordDetail from '../../components/RecordDetail';
import { getSupabase, getSupabaseTableName, mapReportRow } from '../../utils/supabaseServer';

export default function RecordDetailPage({ record, id }) {
  return <RecordDetail record={record} id={id} />;
}

export async function getServerSideProps({ params }) {
  const id = params?.id ?? null;
  const supabase = getSupabase();
  let record = null;

  if (supabase) {
    const tableName = getSupabaseTableName();
    try {
      // Try sequential, explicit queries to avoid .or parsing issues with special chars
      const tryEq = async (col) => {
        const { data: rows, error } = await supabase.from(tableName).select('*').eq(col, id).limit(1);
        if (error) return { error };
        return { rows };
      };

      const colsToTry = ['s', 's_no', 'sno', 'id', 'cnic', 'cnic_number'];
      for (const col of colsToTry) {
        const { rows, error } = await tryEq(col);
        if (error) {
          console.warn(`Querying ${col} failed:`, error.message || error);
          continue;
        }
        if (rows && rows.length > 0) {
          record = mapReportRow(rows[0]);
          break;
        }
      }
    } catch (err) {
      console.error('Error fetching record from Supabase:', err);
    }
  } else {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(process.cwd(), 'data', 'data.json');
    try {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const data = JSON.parse(raw);
      record = data.find((row) => String(row['S.#'] ?? row['s.#'] ?? row['id'] ?? row['CNIC'] ?? row['cnic']) === id) || null;
    } catch (err) {
      console.warn('Unable to read record data from data.json:', err.message);
    }
  }

  return { props: { record, id } };
}
