import { useEffect, useState } from "react";
import api from "./lib/api";

type Group = { id: number; name: string; created_at: string };

export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("Roommates");
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Group[]>("/groups");
      // newest first (optional)
      const sorted = [...res.data].sort(
        (a, b) => +new Date(b.created_at) - +new Date(a.created_at)
      );
      setGroups(sorted);
    } catch (e: unknown) {
      console.error("Failed to load groups", e);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<Group>("/groups", { name });
      // optimistic prepend (keeps sort; or call loadGroups() if you prefer)
      setGroups((g) => [res.data, ...g]);
      setNewName("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(`Failed to create group${msg ? `: ${msg}` : ""}`);
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const isCreateDisabled = creating || newName.trim().length === 0;

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">💸 Expense Splitter</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Create Group</h2>

          <form onSubmit={createGroup} className="flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2"
              placeholder="Group name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={creating}
              aria-label="Group name"
            />
            <button
              type="submit"
              disabled={isCreateDisabled}
              className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </form>

          {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Groups</h2>
            <button
              onClick={loadGroups}
              className="text-sm underline disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-neutral-500">No groups yet.</p>
          ) : (
            <ul className="divide-y">
              {groups.map((g) => (
                <li
                  key={g.id}
                  className="py-2 flex items-center justify-between"
                >
                  <span className="font-medium">{g.name}</span>
                  <span className="text-xs text-neutral-500">
                    {new Date(g.created_at).toLocaleString()} · #{g.id}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
