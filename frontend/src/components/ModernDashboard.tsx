import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, RefreshCw, Wallet, Trash2 } from "lucide-react";

//Import shared types from your API module
import type { Group, Member, Expense, Balance } from "../lib/api";

/* -------------------------------------------------------
   Props and component
------------------------------------------------------- */
type Props = {
  /* data */
  groups: Group[];
  activeGroupId: number | null;
  members: Member[];
  expenses: Expense[];
  balances: Balance[];

  /* flags */
  creatingGroup?: boolean;
  creatingMember?: boolean;
  creatingExpense?: boolean;
  deletingGroupId?: number | null;
  deletingMemberId?: number | null;
  deletingExpenseId?: number | null;

  /* groups */
  onSelectGroup: (id: number | null) => void; // <- accept null
  onRefreshGroups: () => void;
  onCreateGroup: (name: string) => Promise<void> | void;
  onDeleteGroup: (id: number) => Promise<void> | void;

  /* members */
  onCreateMember: (name: string, email: string) => Promise<void> | void;
  onDeleteMember: (id: number) => Promise<void> | void;
  onRefreshMembers: () => void;

  /* expenses */
  onCreateExpense: (
    desc: string,
    amt: number,
    payerId: number
  ) => Promise<void> | void;
  onDeleteExpense: (id: number) => Promise<void> | void;
  onRefreshExpenses: () => void;

  /* balances */
  onRefreshBalances: () => void;
};

export default function ModernDashboard(p: Props) {
  // ---------- local inputs ----------
  const [groupName, setGroupName] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [expensePayerId, setExpensePayerId] = useState<number | "">("");

  // keep payer id valid when members array changes
  useEffect(() => {
    if (p.members.length === 0) {
      setExpensePayerId("");
      return;
    }

    const exists =
      typeof expensePayerId === "number" &&
      p.members.some((m) => m.id === expensePayerId);

    if (!exists) {
      setExpensePayerId(p.members[0].id);
    }
  }, [p.members, expensePayerId]);

  const activeGroup = p.groups.find((g) => g.id === p.activeGroupId) || null;

  // ---------- actions ----------
  const handleCreateGroup = async () => {
    const name = groupName.trim();
    if (!name) return;
    await p.onCreateGroup(name);
    setGroupName("");
  };

  const handleCreateMember = async () => {
    const name = memberName.trim();
    const email = memberEmail.trim();
    if (!name || !email) return;
    await p.onCreateMember(name, email);
    setMemberName("");
    setMemberEmail("");
  };

  const handleCreateExpense = async () => {
    if (!activeGroup) return;
    const desc = expenseDesc.trim();
    const amt = parseFloat(expenseAmount);
    const payer =
      typeof expensePayerId === "number" ? expensePayerId : undefined;

    if (!desc || !amt || !isFinite(amt) || amt <= 0 || !payer) return;

    await p.onCreateExpense(desc, amt, payer);
    setExpenseDesc("");
    setExpenseAmount("");
  };

  // ---------- layout ----------
  return (
    <div className="min-h-dvh flex flex-col bg-gradient-to-b from-white to-neutral-50">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <span className="font-semibold">Expense Splitter</span>
          </div>
          <div className="hidden sm:flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="secondary" className="gap-1">
              <Wallet className="size-3" /> {p.expenses.length} expenses
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="size-3" /> {p.members.length} members
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 grid gap-4 md:gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
          {/* Sidebar: Groups */}
          <aside className="space-y-4 md:space-y-6 md:sticky md:top-4 self-start">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="size-5 text-blue-600" />
                  Groups
                </CardTitle>
                <CardDescription>
                  Choose a group or make a new one.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    aria-label="New group name"
                  />
                  <Button
                    onClick={handleCreateGroup}
                    disabled={!!p.creatingGroup}
                  >
                    <Plus className="size-4 mr-1.5" />
                    Add
                  </Button>
                </div>

                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{p.groups.length} total</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-neutral-600"
                    onClick={p.onRefreshGroups}
                    title="Refresh groups"
                  >
                    <RefreshCw className="size-4 mr-1" />
                    Refresh
                  </Button>
                </div>

                {p.groups.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-3 text-sm text-neutral-500">
                    No groups yet.
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {p.groups.map((g) => {
                      const isActive = g.id === p.activeGroupId;
                      return (
                        <li
                          key={g.id}
                          className={`group flex items-center justify-between rounded-lg border px-3 py-2 transition ${
                            isActive
                              ? "border-blue-200 bg-blue-50"
                              : "hover:bg-neutral-50"
                          }`}
                        >
                          <button
                            className="text-left font-medium truncate"
                            onClick={() => p.onSelectGroup(g.id)}
                            title={`Open ${g.name}`}
                          >
                            {g.name}
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-neutral-400">
                              #{g.id}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-rose-600 hover:text-rose-700"
                              onClick={() => p.onDeleteGroup(g.id)}
                              disabled={p.deletingGroupId === g.id}
                              title="Delete group"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </aside>

          {/* Main column */}
          <section className="space-y-4 md:space-y-6">
            <header className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold">Expense Splitter</h1>
                <p className="text-sm text-neutral-500">
                  Select a group to get started.
                </p>
              </div>
            </header>

            <Tabs defaultValue="members" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="expenses">Expenses</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
              </TabsList>

              {/* Members */}
              <TabsContent value="members">
                <Card>
                  <CardHeader>
                    <CardTitle>Members</CardTitle>
                    <CardDescription>
                      Invite or manage your group members.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Input
                        placeholder="Member name"
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        aria-label="Member name"
                      />
                      <Input
                        placeholder="email@example.com"
                        type="email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        aria-label="Member email"
                      />
                      <Button
                        onClick={handleCreateMember}
                        disabled={!activeGroup || !!p.creatingMember}
                      >
                        <Plus className="size-4 mr-1.5" />
                        Add
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{p.members.length} total</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-neutral-600"
                        onClick={p.onRefreshMembers}
                      >
                        <RefreshCw className="size-4 mr-1" />
                        Refresh
                      </Button>
                    </div>

                    {p.members.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-neutral-500">
                        No members yet.
                      </div>
                    ) : (
                      <ul className="divide-y rounded-xl border">
                        {p.members.map((m) => (
                          <li
                            key={m.id}
                            className="flex items-center justify-between px-3 py-2"
                          >
                            <div className="truncate">
                              <div className="font-medium">{m.name}</div>
                              <div className="text-xs text-neutral-500">
                                {m.email}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-neutral-400">
                                #{m.id}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-rose-600 hover:text-rose-700"
                                onClick={() => p.onDeleteMember(m.id)}
                                disabled={p.deletingMemberId === m.id}
                                title="Remove member"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Expenses */}
              <TabsContent value="expenses">
                <Card>
                  <CardHeader>
                    <CardTitle>Expenses</CardTitle>
                    <CardDescription>
                      Track how much each person paid.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-2 sm:grid-cols-[1fr_140px_1fr_auto]">
                      <Input
                        placeholder="Description"
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                        aria-label="Expense description"
                      />
                      <Input
                        placeholder="Amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        aria-label="Expense amount"
                      />
                      <select
                        className="h-9 rounded-md border bg-background px-3 text-sm"
                        aria-label="Payer"
                        value={expensePayerId === "" ? "" : expensePayerId}
                        onChange={(e) =>
                          setExpensePayerId(
                            e.target.value ? Number(e.target.value) : ""
                          )
                        }
                      >
                        {p.members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                      <Button
                        onClick={handleCreateExpense}
                        disabled={!activeGroup || !!p.creatingExpense}
                      >
                        <Plus className="size-4 mr-1.5" />
                        Add Expense
                      </Button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500">
                      <span>{p.expenses.length} total</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-neutral-600"
                        onClick={p.onRefreshExpenses}
                      >
                        <RefreshCw className="size-4 mr-1" />
                        Refresh
                      </Button>
                    </div>

                    {p.expenses.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-neutral-500">
                        No expenses yet.
                      </div>
                    ) : (
                      <ul className="divide-y rounded-xl border">
                        {p.expenses.map((x) => {
                          const payer =
                            p.members.find((m) => m.id === x.payer_id)?.name ??
                            `#${x.payer_id}`;
                          return (
                            <li
                              key={x.id}
                              className="flex items-center justify-between px-3 py-2"
                            >
                              <div className="truncate">
                                <span className="font-medium">{payer}</span>{" "}
                                <span className="text-neutral-600">paid</span>{" "}
                                <span className="font-medium">
                                  {new Intl.NumberFormat(undefined, {
                                    style: "currency",
                                    currency: "USD",
                                  }).format(x.amount)}
                                </span>{" "}
                                <span className="text-neutral-500">
                                  — {x.description}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-neutral-400">
                                  #{x.id}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-rose-600 hover:text-rose-700"
                                  onClick={() => p.onDeleteExpense(x.id)}
                                  disabled={p.deletingExpenseId === x.id}
                                  title="Delete expense"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Balances */}
              <TabsContent value="balances">
                <Card>
                  <CardHeader>
                    <CardTitle>Balances</CardTitle>
                    <CardDescription>
                      Who owes what after all expenses.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-neutral-600"
                        onClick={p.onRefreshBalances}
                      >
                        <RefreshCw className="size-4 mr-1" />
                        Refresh
                      </Button>
                    </div>

                    {p.balances.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-3 text-sm text-neutral-500">
                        No balances yet.
                      </div>
                    ) : (
                      <ul className="divide-y rounded-xl border">
                        {p.balances.map((b) => (
                          <li
                            key={b.member_id}
                            className="flex items-center justify-between px-3 py-2"
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
                              {new Intl.NumberFormat(undefined, {
                                style: "currency",
                                currency: "USD",
                              }).format(Math.abs(b.net))}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60">
        <div className="mx-auto max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-4 text-xs text-neutral-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} Expense Splitter</span>
          <span>v1</span>
        </div>
      </footer>
    </div>
  );
}
