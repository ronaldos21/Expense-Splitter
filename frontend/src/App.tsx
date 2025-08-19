import { useEffect, useState } from "react";
import api from "./lib/api";

type Group = { id: number; name: string; created_at: string };
type Member = {
  id: number;
  group_id: number;
  name: string;
  email: string;
  created_at: string;
};

export default function App() {
  // --- groups ---
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("Roommates");
  const [error, setError] = useState<string | null>(null);

  // --- selection ---
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  // --- members ---
  const [members, setMembers] = useState<Member[]>([]);
  const [mLoading, setMLoading] = useState(false);
  const [mCreating, setMCreating] = useState(false);
  const [mName, setMName] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mError, setMError] = useState<string | null>(null);

  // -------- Groups --------
  const loadGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Group[]>("/groups");
      setGroups(res.data);

      // if nothing selected yet, pick the first group (optional)
      if (!activeGroup && res.data.length > 0) setActiveGroup(res.data[0]);
    } catch (e) {
      console.error("Failed to load groups", e);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await api.post<Group>("/groups", { name });
      setGroups((g) => [res.data, ...g]);
      setNewName("");
      setActiveGroup(res.data); // auto-select the new group
    } catch (e) {
      console.error("Failed to create group", e);
      setError("Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  // -------- Members --------
  const loadMembers = async (gid: number) => {
    setMLoading(true);
    setMError(null);
    try {
      const res = await api.get<Member[]>(`/groups/${gid}/members`);
      setMembers(res.data);
    } catch (e) {
      console.error("Failed to load members", e);
      setMError("Failed to load members");
    } finally {
      setMLoading(false);
    }
  };

  const createMember = async () => {
    if (!activeGroup) return;
    const name = mName.trim();
    const email = mEmail.trim();
    if (!name || !email) return;

    setMCreating(true);
    setMError(null);
    try {
      const res = await api.post<Member>(`/groups/${activeGroup.id}/members`, {
        name,
        email,
      });
      setMembers((m) => [res.data, ...m]);
      setMName("");
      setMEmail("");
    } catch (e) {
      console.error("Failed to create member", e);
      setMError("Failed to create member");
    } finally {
      setMCreating(false);
    }
  };

  // initial load
  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when active group changes, load its members
  useEffect(() => {
    if (activeGroup) loadMembers(activeGroup.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">💸 Expense Splitter</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Create Group */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold mb-3">Create Group</h2>
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-xl border px-3 py-2"
              placeholder="Group name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              onClick={createGroup}
              disabled={creating}
              className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
        </section>

        {/* Groups list */}
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Groups</h2>
            <button onClick={loadGroups} className="text-sm underline">
              Refresh
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-neutral-500">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-neutral-500">No groups yet.</p>
          ) : (
            <ul className="divide-y">
              {groups.map((g) => {
                const isActive = activeGroup?.id === g.id;
                return (
                  <li
                    key={g.id}
                    className="py-2 flex items-center justify-between cursor-pointer hover:bg-neutral-50 rounded-lg px-2"
                    onClick={() => setActiveGroup(g)}
                  >
                    <span
                      className={`font-medium ${
                        isActive ? "text-blue-600" : ""
                      }`}
                    >
                      {g.name}
                    </span>
                    <span className="text-xs text-neutral-500">#{g.id}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Members for active group */}
        {activeGroup && (
          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">
                Members ·{" "}
                <span className="text-neutral-500">{activeGroup.name}</span>
              </h2>
              <button
                onClick={() => loadMembers(activeGroup.id)}
                className="text-sm underline"
              >
                Refresh
              </button>
            </div>

            {/* Create Member */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                className="flex-1 rounded-xl border px-3 py-2"
                placeholder="Member name"
                value={mName}
                onChange={(e) => setMName(e.target.value)}
              />
              <input
                className="flex-1 rounded-xl border px-3 py-2"
                placeholder="email@example.com"
                value={mEmail}
                onChange={(e) => setMEmail(e.target.value)}
                type="email"
              />
              <button
                onClick={createMember}
                disabled={mCreating}
                className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
              >
                {mCreating ? "Adding…" : "Add"}
              </button>
            </div>

            {mError && <p className="text-sm text-rose-600 mb-2">{mError}</p>}

            {mLoading ? (
              <p className="text-sm text-neutral-500">Loading…</p>
            ) : members.length === 0 ? (
              <p className="text-sm text-neutral-500">No members yet.</p>
            ) : (
              <ul className="divide-y">
                {members.map((m) => (
                  <li
                    key={m.id}
                    className="py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-neutral-500">{m.email}</p>
                    </div>
                    <span className="text-xs text-neutral-500">#{m.id}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

//to be completed step 4 commit and pr
