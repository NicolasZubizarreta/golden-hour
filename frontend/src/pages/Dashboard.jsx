import { useParams } from 'react-router-dom';

export default function Dashboard() {
  const { id } = useParams();
  return <div className="p-8 text-2xl font-bold text-green-600">Dashboard du Groupe #{id}</div>;
}