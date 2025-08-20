import { useEffect, useState } from "react";
import api from "../lib/api";

type Group = { id: number; name: string; created_at: string };

export default function GroupList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<Group[]>("/groups");
        setGroups(res.data);
      } catch {
        setError("Failed to load groups");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <p className="text-sm text-neutral-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <ul className="space-y-2">
      {groups.map((g) => (
        <li key={g.id} className="rounded border p-3">
          <div className="font-medium">{g.name}</div>
          <div className="text-xs text-neutral-500">
            {new Date(g.created_at).toLocaleString()}
          </div>
        </li>
      ))}
    </ul>
  );
}
