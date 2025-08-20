import { useEffect, useState } from "react";
import api from "./lib/api";
import { useMemo } from "react";

import { getExpenses, getBalances, createExpense } from "./lib/api";

type Group = { id: number; name: string; created_at: string };
type Member = {
  id: number;
  group_id: number;
  name: string;
  email: string;
  created_at: string;
};

type ExpenseShare = { member_id: number; share: number };
type Expense = {
  id: number;
  group_id: number;
  payer_id: number;
  amount: number;
  description: string;
  created_at: string;
  shares: ExpenseShare[];
};

type Balance = { member_id: number; name: string; net: number };

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

  //expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [eDesc, setEDesc] = useState("");
  const [eAmount, setEAmount] = useState<string>("");
  const [ePayerId, setEPayerId] = useState<number | null>(null);
  const [eLoading, setELoading] = useState(false);
  const [eCreating, setECreating] = useState(false);
  const [eError, setEError] = useState<string | null>(null);

  // balances
  const [balances, setBalances] = useState<Balance[]>([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState<string | null>(null);

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
    } catch (e: unknown) {
      console.error("Failed to create member", e);
      setMError("Failed to create member");
    } finally {
      setMCreating(false);
    }
  };

  async function loadExpenses(gid: number) {
    setELoading(true);
    setEError(null);
    try {
      const res = await getExpenses(gid);
      setExpenses(res.data);
    } catch (err: unknown) {
      console.error("Failed to load expenses", err);
      setEError("Failed to load expenses");
    } finally {
      setELoading(false);
    }
  }

  async function loadBalances(gid: number) {
    setBLoading(true);
    setBError(null);
    try {
      const res = await getBalances(gid);
      setBalances(res.data);
    } catch (err: unknown) {
      console.error("Failed to load balances", err);
      setBError("Failed to load balances");
    } finally {
      setBLoading(false);
    }
  }

  async function onCreateExpense() {
    if (!activeGroup) return;
    const amount = parseFloat(eAmount);
    const desc = eDesc.trim();
    if (!desc || !amount || !isFinite(amount) || amount <= 0) return;
    if (!ePayerId || members.length === 0) {
      setEError("Need a payer and at least one member");
      return;
    }

    // Equal split with rounding fix
    const each = Math.round((amount / members.length) * 100) / 100;
    const remainder =
      Math.round(amount * 100) - Math.round(each * 100) * members.length;
    const shares: ExpenseShare[] = members.map((m, idx) => {
      let cents = Math.round(each * 100);
      if (remainder !== 0 && idx < Math.abs(remainder))
        cents += remainder > 0 ? 1 : -1;
      return { member_id: m.id, share: cents / 100 };
    });

    setECreating(true);
    setEError(null);
    try {
      const res = await createExpense(activeGroup.id, {
        description: desc,
        amount,
        payer_id: ePayerId,
        shares,
      });
      setExpenses((xs) => [res.data, ...xs]);
      setEDesc("");
      setEAmount("");
      loadBalances(activeGroup.id);
    } catch (e: unknown) {
      console.error("Failed to create expense", e);
      setEError("Failed to create expense");
    } finally {
      setECreating(false);
    }
  }

  // initial load
  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when active group changes, load its members
  useEffect(() => {
    if (!activeGroup) return;
    loadMembers(activeGroup.id);
    loadExpenses(activeGroup.id);
    loadBalances(activeGroup.id);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id]);

  //track memebers ids in a stable way for deps array
  const memberIds = useMemo(
    () => members.map((m) => m.id).join(","),
    [members]
  );

  useEffect(() => {
    if (!members.length) return;

    // only set if ePayerId is null or no longer in the list
    const payerStillExists = members.some((m) => m.id === ePayerId);
    if (ePayerId == null || !payerStillExists) {
      setEPayerId(members[0].id);
    }
  }, [memberIds, ePayerId, members]);

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

            {/* Create + List expenses*/}
            {activeGroup && (
              <section>
                <div className="flex items-center justify-between">
                  <h2>Expenses · {activeGroup.name}</h2>
                  <button onClick={() => loadExpenses(activeGroup.id)}>
                    Refresh
                  </button>
                </div>

                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "1fr 150px 180px 140px" }}
                >
                  <input
                    placeholder="Description"
                    value={eDesc}
                    onChange={(e) => setEDesc(e.target.value)}
                  />
                  <input
                    placeholder="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eAmount}
                    onChange={(e) => setEAmount(e.target.value)}
                  />
                  <select
                    value={ePayerId ?? ""}
                    onChange={(e) => setEPayerId(Number(e.target.value))}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button disabled={eCreating} onClick={onCreateExpense}>
                    {eCreating ? "Adding…" : "Add Expense"}
                  </button>
                </div>
                {eError && <p style={{ color: "crimson" }}>{eError}</p>}

                {eLoading ? (
                  <p>Loading…</p>
                ) : expenses.length === 0 ? (
                  <p>No expenses yet.</p>
                ) : (
                  <ul>
                    {expenses.map((x) => (
                      <li key={x.id}>
                        <strong>
                          {members.find((m) => m.id === x.payer_id)?.name ||
                            `#${x.payer_id}`}
                        </strong>
                        {" paid $"}
                        {x.amount.toFixed(2)}
                        {" — "}
                        {x.description}
                      </li>
                    ))}
                  </ul>
                )}

                {/* Balances */}
                {activeGroup && (
                  <section>
                    <div className="flex items-center justify-between">
                      <h2>Balances · {activeGroup.name}</h2>
                      <button onClick={() => loadBalances(activeGroup.id)}>
                        Refresh
                      </button>
                    </div>

                    {bError && <p style={{ color: "crimson" }}>{bError}</p>}
                    {bLoading ? (
                      <p>Loading…</p>
                    ) : balances.length === 0 ? (
                      <p>No balances yet.</p>
                    ) : (
                      <ul>
                        {balances.map((b) => (
                          <li key={b.member_id}>
                            {b.name}{" "}
                            {b.net > 0
                              ? "is owed"
                              : b.net < 0
                              ? "owes"
                              : "is settled"}{" "}
                            ${Math.abs(b.net).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                )}
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
