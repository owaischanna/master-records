import path from 'path';
import fs from 'fs';
import RecordDetail from '../../components/RecordDetail';

export default function RecordDetailPage({ record, id }) {
  return (
    <RecordDetail record={record} id={id} />
  );
}

export async function getStaticPaths() {
  const dataPath = path.join(process.cwd(), 'data', 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);

  const paths = data.map((row) => {
    const id = String(row['S.#'] ?? row['s.#'] ?? row['id'] ?? row['CNIC'] ?? row['cnic']);
    return { params: { id } };
  }).filter((item) => item.params.id);

  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const dataPath = path.join(process.cwd(), 'data', 'data.json');
  const raw = fs.readFileSync(dataPath, 'utf8');
  const data = JSON.parse(raw);
  const record = data.find((row) => String(row['S.#'] ?? row['s.#'] ?? row['id'] ?? row['CNIC'] ?? row['cnic']) === params.id);

  return { props: { record: record || null, id: params.id } };
}
