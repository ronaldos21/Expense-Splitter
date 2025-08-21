import { useEffect, useState } from "react";
import ModernDashboard, {
  type Group,
  type Member,
  type Expense,
  type Balance,
} from "./components/ModernDashboard";

import {
  getGroups,
  createGroup as apiCreateGroup,
  deleteGroup,
  getMembers as apiGetMembers,
  createMember as apiCreateMember,
  deleteMember,
  getExpenses,
  createExpense,
  //updateExpense,
  deleteExpense,
  getBalances,
} from "./lib/api";

export default function App() {
  // ------- Groups -------
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<number | null>(null);

  // ------- Members -------
  const [members, setMembers] = useState<Member[]>([]);
  const [creatingMember, setCreatingMember] = useState(false);
  const [deletingMemberId, setDeletingMemberId] = useState<number | null>(null);

  // ------- Expenses -------
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [creatingExpense, setCreatingExpense] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(
    null
  );

  // ------- Balances -------
  const [balances, setBalances] = useState<Balance[]>([]);

  // ===== API loaders =====
  async function loadGroups() {
    const res = await getGroups();
    const data = res.data as Group[];
    setGroups(data);
    if (!activeGroup && data.length) setActiveGroup(data[0]);
  }

  async function loadMembers(gid: number) {
    const res = await apiGetMembers(gid);
    setMembers(res.data as Member[]);
  }

  async function loadExpensesFor(gid: number) {
    const res = await getExpenses(gid);
    setExpenses(res.data as Expense[]);
  }

  async function loadBalancesFor(gid: number) {
    const res = await getBalances(gid);
    setBalances(res.data as Balance[]);
  }

  const activeGroupId = activeGroup?.id;

  // ===== Effects =====
  useEffect(() => {
    // initial load
    loadGroups().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // whenever the active group changes, refresh its data
    if (!activeGroupId) {
      setMembers([]);
      setExpenses([]);
      setBalances([]);
      return;
    }
    //const gid = activeGroup.id;
    Promise.all([
      loadMembers(activeGroupId),
      loadExpensesFor(activeGroupId),
      loadBalancesFor(activeGroupId),
    ]).catch(console.error);
  }, [activeGroupId]);

  // ===== Group handlers =====
  async function onCreateGroup(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCreatingGroup(true);
    try {
      const res = await apiCreateGroup({ name: trimmed });
      const created = res?.data as Partial<Group> | undefined;

      if (created && typeof created.id === "number") {
        // server returned the full group
        setGroups((prev) => [created as Group, ...prev]);
        setActiveGroup(created as Group);
      } else {
        // server returned something else -> just reload
        await loadGroups();
      }
    } catch (err) {
      console.error("createGroup failed:", err);
      // still try to reflect server state in UI (useful if it actually created)
      await loadGroups();
    } finally {
      setCreatingGroup(false);
    }
  }

  async function onDeleteGroupHandler(gid: number) {
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
    } finally {
      setDeletingGroupId(null);
    }
  }

  const onSelectGroup = (id: number) => {
    const g = groups.find((x) => x.id === id) || null;
    setActiveGroup(g);
  };

  // ===== Member handlers =====
  async function onCreateMember(name: string, email: string) {
    if (!activeGroup) return;
    const gid = activeGroup.id;
    setCreatingMember(true);
    try {
      const res = await apiCreateMember(gid, {
        name: name.trim(),
        email: email.trim(),
      });
      setMembers((prev) => [res.data as Member, ...prev]);
      await loadBalancesFor(gid);
    } finally {
      setCreatingMember(false);
    }
  }

  async function onDeleteMemberHandler(memberId: number) {
    if (!activeGroup) return;
    const gid = activeGroup.id;
    setDeletingMemberId(memberId);
    try {
      await deleteMember(gid, memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      await loadBalancesFor(gid);
    } finally {
      setDeletingMemberId(null);
    }
  }

  // ===== Expense handlers =====
  async function onCreateExpense(
    desc: string,
    amount: number,
    payerId: number
  ) {
    if (!activeGroup) return;
    const gid = activeGroup.id;

    // equal split across current members (to cents, with remainder distribution)
    const each = Math.round((amount / Math.max(1, members.length)) * 100);
    let remainder = Math.round(amount * 100) - each * members.length;
    const shares = members.map((m) => {
      let cents = each;
      if (remainder !== 0) {
        cents += remainder > 0 ? 1 : -1;
        remainder += remainder > 0 ? -1 : 1;
      }
      return { member_id: m.id, share: cents / 100 };
    });

    setCreatingExpense(true);
    try {
      const res = await createExpense(gid, {
        description: desc.trim(),
        amount,
        payer_id: payerId,
        shares,
      });
      setExpenses((prev) => [res.data as Expense, ...prev]);
      await loadBalancesFor(gid);
    } finally {
      setCreatingExpense(false);
    }
  }

  async function onDeleteExpenseHandler(expenseId: number) {
    if (!activeGroup) return;
    const gid = activeGroup.id;
    setDeletingExpenseId(expenseId);
    try {
      await deleteExpense(gid, expenseId);
      setExpenses((prev) => prev.filter((x) => x.id !== expenseId));
      await loadBalancesFor(gid);
    } finally {
      setDeletingExpenseId(null);
    }
  }

  // ===== Render =====
  return (
    <ModernDashboard
      // data
      groups={groups}
      activeGroupId={activeGroup?.id ?? null}
      members={members}
      expenses={expenses}
      balances={balances}
      // flags
      creatingGroup={creatingGroup}
      creatingMember={creatingMember}
      creatingExpense={creatingExpense}
      deletingGroupId={deletingGroupId}
      deletingMemberId={deletingMemberId}
      deletingExpenseId={deletingExpenseId}
      // group handlers
      onSelectGroup={onSelectGroup}
      onRefreshGroups={loadGroups}
      onCreateGroup={onCreateGroup}
      onDeleteGroup={onDeleteGroupHandler}
      // member handlers
      onCreateMember={onCreateMember}
      onDeleteMember={onDeleteMemberHandler}
      onRefreshMembers={() => activeGroup && loadMembers(activeGroup.id)}
      // expense handlers
      onCreateExpense={onCreateExpense}
      onDeleteExpense={onDeleteExpenseHandler}
      onRefreshExpenses={() => activeGroup && loadExpensesFor(activeGroup.id)}
      // balances
      onRefreshBalances={() => activeGroup && loadBalancesFor(activeGroup.id)}
    />
  );
}
