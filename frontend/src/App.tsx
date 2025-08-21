import { useEffect, useMemo, useState } from "react";
import {
  getGroups,
  createGroup as apiCreateGroup,
  getMembers as apiGetMembers,
  createMember as apiCreateMember,
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getBalances,
  deleteGroup,
  deleteMember,
} from "./lib/api"; // change to "./api" if that's your path

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

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);

// --- tiny UI helpers (no deps) ---
const btnBase =
  "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50";
const btnPrimary = `${btnBase} bg-blue-600 text-white hover:bg-blue-700`;
const btnSubtle = `${btnBase} bg-neutral-100 text-neutral-800 hover:bg-neutral-200`;
const btnDanger = `${btnBase} bg-rose-600 text-white hover:bg-rose-700`;
const field =
  "w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30";
const card = "rounded-2xl border bg-white p-5 shadow-sm";
const kbd =
  "rounded-md bg-neutral-100 px-1.5 py-0.5 text-[11px] font-mono text-neutral-600";

export default function App() {
  // groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  // members
  const [members, setMembers] = useState<Member[]>([]);
  const [mLoading, setMLoading] = useState(false);
  const [mCreating, setMCreating] = useState(false);
  const [mName, setMName] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mError, setMError] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);

  // expenses
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [eDesc, setEDesc] = useState("");
  const [eAmount, setEAmount] = useState<string>("");
  const [ePayerId, setEPayerId] = useState<number | null>(null);
  const [eLoading, setELoading] = useState(false);
  const [eCreating, setECreating] = useState(false);
  const [eError, setEError] = useState<string | null>(null);

  // edit/delete expense
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDesc, setEditDesc] = useState("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editPayerId, setEditPayerId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // balances
  const [balances, setBalances] = useState<Balance[]>([]);
  const [bLoading, setBLoading] = useState(false);
  const [bError, setBError] = useState<string | null>(null);

  // -------- Groups --------
  async function loadGroups() {
    setLoading(true);
    setError(null);
    try {
      const res = await getGroups();
      const data = res.data as Group[];
      setGroups(data);
      if (!activeGroup && data.length > 0) setActiveGroup(data[0]);
    } catch (e) {
      console.error(e);
      setError("Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  async function onCreateGroup() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    setError(null);
    try {
      const res = await apiCreateGroup({ name });
      const g = res.data as Group;
      setGroups((prev) => [g, ...prev]);
      setNewName("");
      setActiveGroup(g);
    } catch (e) {
      console.error(e);
      setError("Failed to create group");
    } finally {
      setCreating(false);
    }
  }

  async function onDeleteGroup(gid: number) {
    if (!confirm("Delete this group and all data?")) return;
    setDeletingGroupId(gid);
    try {
      await deleteGroup(gid);
      const remaining = groups.filter((g) => g.id !== gid);
      setGroups(remaining);
      if (activeGroup?.id === gid) {
        setActiveGroup(remaining[0] ?? null);
        setMembers([]);
        setExpenses([]);
        setBalances([]);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete group");
    } finally {
      setDeletingGroupId(null);
    }
  }

  // -------- Members --------
  async function loadMembers(gid: number) {
    setMLoading(true);
    setMError(null);
    try {
      const res = await apiGetMembers(gid);
      setMembers(res.data as Member[]);
    } catch (e) {
      console.error(e);
      setMError("Failed to load members");
    } finally {
      setMLoading(false);
    }
  }

  async function onCreateMember() {
    if (!activeGroup) return;
    const name = mName.trim(),
      email = mEmail.trim();
    if (!name || !email) return;
    setMCreating(true);
    setMError(null);
    try {
      const res = await apiCreateMember(activeGroup.id, { name, email });
      setMembers((prev) => [res.data as Member, ...prev]);
      setMName("");
      setMEmail("");
    } catch (e) {
      console.error(e);
      setMError("Failed to create member");
    } finally {
      setMCreating(false);
    }
  }

  async function onDeleteMember(mid: number) {
    if (!activeGroup) return;
    if (!confirm("Remove this member? Their shares will be removed.")) return;
    setDeletingMemberId(mid);
    try {
      await deleteMember(activeGroup.id, mid);
      setMembers((ms) => ms.filter((m) => m.id !== mid));
      await loadBalancesFor(activeGroup.id);
    } catch (e) {
      console.error(e);
      alert("Failed to delete member");
    } finally {
      setDeletingMemberId(null);
    }
  }

  // -------- Expenses --------
  async function loadExpensesFor(gid: number) {
    setELoading(true);
    setEError(null);
    try {
      const res = await getExpenses(gid);
      setExpenses(res.data as Expense[]);
    } catch (e) {
      console.error(e);
      setEError("Failed to load expenses");
    } finally {
      setELoading(false);
    }
  }

  async function onCreateExpense() {
    if (!activeGroup) return;
    const amount = parseFloat(eAmount),
      desc = eDesc.trim();
    if (!desc || !amount || !isFinite(amount) || amount <= 0) return;
    if (!ePayerId || members.length === 0) {
      setEError("Need a payer and at least one member");
      return;
    }

    // Equal split with rounding distribution
    const each = Math.round((amount / members.length) * 100) / 100;
    const remainder =
      Math.round(amount * 100) - Math.round(each * 100) * members.length;

    const shares: ExpenseShare[] = members.map((m, idx) => {
      let cents = Math.round(each * 100);
      if (remainder !== 0 && idx < Math.abs(remainder)) {
        cents += remainder > 0 ? 1 : -1;
      }
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
      setExpenses((xs) => [res.data as Expense, ...xs]);
      setEDesc("");
      setEAmount("");
      await loadBalancesFor(activeGroup.id);
    } catch (e) {
      console.error(e);
      setEError("Failed to create expense");
    } finally {
      setECreating(false);
    }
  }

  function startEdit(x: Expense) {
    setEditingId(x.id);
    setEditDesc(x.description);
    setEditAmount(String(x.amount));
    setEditPayerId(x.payer_id);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditDesc("");
    setEditAmount("");
    setEditPayerId(null);
  }
  async function saveEdit(expenseId: number) {
    if (!activeGroup) return;
    const desc = editDesc.trim(),
      amt = parseFloat(editAmount),
      payer = editPayerId;
    if (!desc || !amt || !isFinite(amt) || amt <= 0 || !payer) return;
    setSavingId(expenseId);
    try {
      await updateExpense(activeGroup.id, expenseId, {
        description: desc,
        amount: amt,
        payer_id: payer,
      });
      await loadExpensesFor(activeGroup.id);
      await loadBalancesFor(activeGroup.id);
      cancelEdit();
    } catch (e) {
      console.error(e);
      alert("Failed to update expense");
    } finally {
      setSavingId(null);
    }
  }

  async function onDeleteExpense(expenseId: number) {
    if (!activeGroup) return;
    if (!confirm("Delete this expense?")) return;
    setDeletingId(expenseId);
    try {
      await deleteExpense(activeGroup.id, expenseId);
      setExpenses((xs) => xs.filter((x) => x.id !== expenseId));
      await loadBalancesFor(activeGroup.id);
    } catch (e) {
      console.error(e);
      alert("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  }

  // -------- Balances --------
  async function loadBalancesFor(gid: number) {
    setBLoading(true);
    setBError(null);
    try {
      const res = await getBalances(gid);
      setBalances(res.data as Balance[]);
    } catch (e) {
      console.error(e);
      setBError("Failed to load balances");
    } finally {
      setBLoading(false);
    }
  }

  const memberIds = useMemo(
    () => members.map((m) => m.id).join(","),
    [members]
  );

  useEffect(() => {
    loadGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!activeGroup) return;
    loadMembers(activeGroup.id);
    loadExpensesFor(activeGroup.id);
    loadBalancesFor(activeGroup.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroup?.id]);
  useEffect(() => {
    if (!members.length) return;
    const stillExists = members.some((m) => m.id === ePayerId);
    if (ePayerId == null || !stillExists) setEPayerId(members[0].id);
  }, [memberIds, ePayerId, members]);

  return (
    <div className="min-h-screen bg-[radial-gradient(60rem_60rem_at_120%_-20%,rgba(59,130,246,0.08),transparent)] text-neutral-900">
      {/* Top nav */}
      <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-2xl">💸</span>
          <h1 className="text-2xl font-bold tracking-tight">
            Expense Splitter
          </h1>
          <span className="ml-auto text-xs text-neutral-500">
            Tip: press <span className={kbd}>R</span> to Refresh
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Create Group */}
        <section className={card}>
          <h2 className="font-semibold mb-3">Create Group</h2>
          <div className="flex gap-2">
            <input
              className={field}
              placeholder="e.g. Roommates, Trip to NYC, Soccer Team"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <button
              onClick={onCreateGroup}
              disabled={creating}
              className={btnPrimary}
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
          {error && <p className="text-sm text-rose-600 mt-2">{error}</p>}
        </section>

        {/* 2-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Groups */}
          <section className={card}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Groups</h2>
              <button
                onClick={loadGroups}
                className="text-sm text-blue-600 hover:underline"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-neutral-500">Loading…</p>
            ) : groups.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-sm text-neutral-500">
                No groups yet. Create your first group above.
              </div>
            ) : (
              <ul className="divide-y">
                {groups.map((g) => {
                  const isActive = activeGroup?.id === g.id;
                  return (
                    <li
                      key={g.id}
                      className="py-2 flex items-center justify-between"
                    >
                      <button
                        className={`text-left font-medium px-2 py-1 rounded-lg transition ${
                          isActive
                            ? "text-blue-700 bg-blue-50"
                            : "hover:bg-neutral-50"
                        }`}
                        onClick={() => setActiveGroup(g)}
                        title={`Open ${g.name}`}
                      >
                        {g.name}
                      </button>
                      <div className="flex items-center gap-3">
                        <span className="text-xs rounded-lg bg-neutral-100 px-2 py-1 text-neutral-500">
                          #{g.id}
                        </span>
                        <button
                          className="text-xs text-rose-600 hover:underline"
                          disabled={deletingGroupId === g.id}
                          onClick={() => onDeleteGroup(g.id)}
                          title="Delete group"
                        >
                          {deletingGroupId === g.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Right column */}
          <div className="space-y-6">
            {/* Members */}
            {activeGroup && (
              <section className={card}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">
                    Members ·{" "}
                    <span className="text-neutral-500">{activeGroup.name}</span>
                    <span className="ml-2 text-xs rounded-lg bg-neutral-100 px-2 py-1 text-neutral-500">
                      {members.length}
                    </span>
                  </h2>
                  <button
                    onClick={() => loadMembers(activeGroup.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 mb-3">
                  <input
                    className={field}
                    placeholder="Member name"
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="email@example.com"
                    value={mEmail}
                    onChange={(e) => setMEmail(e.target.value)}
                    type="email"
                  />
                  <button
                    onClick={onCreateMember}
                    disabled={mCreating}
                    className={btnPrimary}
                  >
                    {mCreating ? "Adding…" : "Add"}
                  </button>
                </div>
                {mError && (
                  <p className="text-sm text-rose-600 mb-2">{mError}</p>
                )}

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
                        <div className="flex items-center gap-3">
                          <span className="text-xs rounded-lg bg-neutral-100 px-2 py-1 text-neutral-500">
                            #{m.id}
                          </span>
                          <button
                            className="text-xs text-rose-600 hover:underline"
                            disabled={deletingMemberId === m.id}
                            onClick={() => onDeleteMember(m.id)}
                            title="Remove member"
                          >
                            {deletingMemberId === m.id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {/* Expenses */}
            {activeGroup && (
              <section className={card}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">
                    Expenses ·{" "}
                    <span className="text-neutral-500">{activeGroup.name}</span>
                    <span className="ml-2 text-xs rounded-lg bg-neutral-100 px-2 py-1 text-neutral-500">
                      {expenses.length}
                    </span>
                  </h2>
                  <button
                    onClick={() => loadExpensesFor(activeGroup.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {/* Create expense */}
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr_130px] gap-2 mb-3">
                  <input
                    className={field}
                    placeholder="Description"
                    value={eDesc}
                    onChange={(e) => setEDesc(e.target.value)}
                  />
                  <input
                    className={field}
                    placeholder="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={eAmount}
                    onChange={(e) => setEAmount(e.target.value)}
                  />
                  <select
                    className={field}
                    value={ePayerId ?? ""}
                    onChange={(e) => setEPayerId(Number(e.target.value))}
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={onCreateExpense}
                    disabled={eCreating}
                    className={btnPrimary}
                  >
                    {eCreating ? "Adding…" : "Add Expense"}
                  </button>
                </div>
                {eError && (
                  <p className="text-sm text-rose-600 mb-2">{eError}</p>
                )}

                {/* List */}
                {eLoading ? (
                  <p className="text-sm text-neutral-500">Loading…</p>
                ) : expenses.length === 0 ? (
                  <p className="text-sm text-neutral-500">No expenses yet.</p>
                ) : (
                  <ul className="divide-y">
                    {expenses.map((x) => {
                      const isEditing = editingId === x.id;
                      const payer = members.find((m) => m.id === x.payer_id);
                      return (
                        <li key={x.id} className="py-2">
                          {!isEditing ? (
                            <div className="flex items-center justify-between gap-2">
                              <div className="truncate">
                                <span className="font-medium">
                                  {payer?.name ?? `#${x.payer_id}`}
                                </span>{" "}
                                <span className="text-neutral-600">paid</span>{" "}
                                <span className="font-medium">
                                  {fmt(x.amount)}
                                </span>{" "}
                                <span className="text-neutral-500">
                                  — {x.description}
                                </span>
                              </div>
                              <div className="shrink-0 flex gap-2">
                                <button
                                  className={btnSubtle}
                                  onClick={() => startEdit(x)}
                                >
                                  Edit
                                </button>
                                <button
                                  className={btnDanger}
                                  disabled={deletingId === x.id}
                                  onClick={() => onDeleteExpense(x.id)}
                                >
                                  {deletingId === x.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
                              <input
                                className={field}
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Description"
                              />
                              <input
                                className={field}
                                type="number"
                                min="0"
                                step="0.01"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                placeholder="Amount"
                              />
                              <select
                                className={field}
                                value={editPayerId ?? ""}
                                onChange={(e) =>
                                  setEditPayerId(Number(e.target.value))
                                }
                              >
                                {members.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name}
                                  </option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <button
                                  className={btnPrimary}
                                  disabled={savingId === x.id}
                                  onClick={() => saveEdit(x.id)}
                                >
                                  {savingId === x.id ? "Saving…" : "Save"}
                                </button>
                                <button
                                  className={btnSubtle}
                                  onClick={cancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            )}

            {/* Balances */}
            {activeGroup && (
              <section className={card}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">
                    Balances ·{" "}
                    <span className="text-neutral-500">{activeGroup.name}</span>
                  </h2>
                  <button
                    onClick={() => loadBalancesFor(activeGroup.id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Refresh
                  </button>
                </div>

                {bError && (
                  <p className="text-sm text-rose-600 mb-2">{bError}</p>
                )}
                {bLoading ? (
                  <p className="text-sm text-neutral-500">Loading…</p>
                ) : balances.length === 0 ? (
                  <p className="text-sm text-neutral-500">No balances yet.</p>
                ) : (
                  <ul className="divide-y">
                    {balances.map((b) => (
                      <li
                        key={b.member_id}
                        className="py-2 flex items-center justify-between"
                      >
                        <span className="font-medium">{b.name}</span>
                        <span
                          className={`text-sm ${
                            b.net > 0
                              ? "text-green-600"
                              : b.net < 0
                              ? "text-rose-600"
                              : "text-neutral-500"
                          }`}
                        >
                          {b.net > 0
                            ? "is owed"
                            : b.net < 0
                            ? "owes"
                            : "settled"}{" "}
                          {fmt(Math.abs(b.net))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
