import { useMemo, useRef, useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Users,
  Wallet,
  PieChart,
  RefreshCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type Group = { id: number; name: string; created_at: string };
export type Member = {
  id: number;
  group_id: number;
  name: string;
  email: string;
  created_at: string;
};
export type Expense = {
  id: number;
  group_id: number;
  payer_id: number;
  amount: number;
  description: string;
  created_at: string;
};
export type Balance = { member_id: number; name: string; net: number };

const fmt = (n: number) =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(n);

type Props = {
  // data
  groups: Group[];
  activeGroupId: number | null;
  members: Member[];
  expenses: Expense[];
  balances: Balance[];

  // loading/disabled flags (optional)
  creatingGroup?: boolean;
  creatingMember?: boolean;
  creatingExpense?: boolean;
  deletingGroupId?: number | null;
  deletingMemberId?: number | null;
  deletingExpenseId?: number | null;

  // handlers (wire to your existing functions)
  onSelectGroup: (id: number) => void;
  onRefreshGroups: () => void;
  onCreateGroup: (name: string) => Promise<void>;
  onDeleteGroup: (id: number) => Promise<void>;

  onCreateMember: (name: string, email: string) => Promise<void>;
  onDeleteMember: (id: number) => Promise<void>;
  onRefreshMembers: () => void;

  onCreateExpense: (
    desc: string,
    amount: number,
    payerId: number
  ) => Promise<void>;
  onDeleteExpense: (id: number) => Promise<void>;
  onEditExpense?: (
    id: number,
    data: { desc?: string; amount?: number; payerId?: number }
  ) => Promise<void>;
  onRefreshExpenses: () => void;

  onRefreshBalances: () => void;
};

export default function ModernDashboard(p: Props) {
  const activeGroup = useMemo(
    () => p.groups.find((g) => g.id === p.activeGroupId) ?? null,
    [p.groups, p.activeGroupId]
  );

  // Typed refs for inputs
  const groupNameRef = useRef<HTMLInputElement>(null);
  const memberNameRef = useRef<HTMLInputElement>(null);
  const memberEmailRef = useRef<HTMLInputElement>(null);
  const expDescRef = useRef<HTMLInputElement>(null);
  const expAmountRef = useRef<HTMLInputElement>(null);

  // Track payer id as state (defaults to first member)
  const [payerId, setPayerId] = useState<number | undefined>(p.members[0]?.id);

  // If member list changes, keep payerId valid
  useEffect(() => {
    if (!p.members.length) {
      setPayerId(undefined);
      return;
    }
    if (!payerId || !p.members.some((m) => m.id === payerId)) {
      setPayerId(p.members[0].id);
    }
  }, [p.members, payerId]);

  return (
    <div className="min-h-screen grid md:grid-cols-[260px_1fr] gap-6 px-4 py-6 max-w-6xl mx-auto">
      {/* Sidebar */}
      <aside className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-blue-600" />
              Groups
            </CardTitle>
            <CardDescription>Choose a group or make a new one.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input placeholder="New group name" ref={groupNameRef} />
              <Button
                disabled={p.creatingGroup}
                onClick={async () => {
                  const name = groupNameRef.current?.value.trim() || "";
                  if (!name) return;
                  await p.onCreateGroup(name);
                  if (groupNameRef.current) groupNameRef.current.value = "";
                }}
              >
                <Plus className="mr-2 size-4" /> Add
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                {p.groups.length} total
              </span>
              <Button variant="ghost" size="sm" onClick={p.onRefreshGroups}>
                <RefreshCcw className="mr-2 size-4" />
                Refresh
              </Button>
            </div>

            <ul className="divide-y rounded-lg border">
              {p.groups.length === 0 ? (
                <li className="p-4 text-sm text-neutral-500">No groups yet.</li>
              ) : (
                p.groups.map((g) => {
                  const isActive = g.id === p.activeGroupId;
                  return (
                    <li
                      key={g.id}
                      className="flex items-center justify-between p-2"
                    >
                      <button
                        className={`text-left flex-1 rounded-md px-2 py-1 hover:bg-neutral-50 ${
                          isActive ? "bg-blue-50 text-blue-700" : ""
                        }`}
                        onClick={() => p.onSelectGroup(g.id)}
                      >
                        {g.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">#{g.id}</Badge>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="size-8"
                          disabled={p.deletingGroupId === g.id}
                          onClick={() => p.onDeleteGroup(g.id)}
                          title="Delete group"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </CardContent>
        </Card>
      </aside>

      {/* Main */}
      <section className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Expense Splitter
            </h1>
            <p className="text-sm text-neutral-500">
              {activeGroup ? (
                <>
                  Active group:{" "}
                  <span className="font-medium">{activeGroup.name}</span>
                </>
              ) : (
                "Select a group to get started."
              )}
            </p>
          </div>
          <div className="hidden md:flex gap-2">
            <Badge variant="secondary" className="gap-1">
              <Wallet className="size-3" /> {p.expenses.length} expenses
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <Users className="size-3" /> {p.members.length} members
            </Badge>
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
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                  <Input placeholder="Member name" ref={memberNameRef} />
                  <Input
                    placeholder="email@example.com"
                    ref={memberEmailRef}
                    type="email"
                  />
                  <Button
                    disabled={p.creatingMember || !activeGroup}
                    onClick={async () => {
                      const name = memberNameRef.current?.value.trim() || "";
                      const email = memberEmailRef?.current?.value.trim() || "";
                      if (!name || !email || !activeGroup) return;
                      await p.onCreateMember(name, email);
                      if (memberNameRef.current)
                        memberNameRef.current.value = "";
                      if (memberEmailRef.current)
                        memberEmailRef.current.value = "";
                    }}
                  >
                    <Plus className="mr-2 size-4" /> Add
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {p.members.length} total
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={p.onRefreshMembers}
                  >
                    <RefreshCcw className="mr-2 size-4" />
                    Refresh
                  </Button>
                </div>

                <ul className="divide-y rounded-lg border">
                  {p.members.length === 0 ? (
                    <li className="p-4 text-sm text-neutral-500">
                      No members yet.
                    </li>
                  ) : (
                    p.members.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center justify-between p-2"
                      >
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-neutral-500">
                            {m.email}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">#{m.id}</Badge>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="size-8"
                            disabled={p.deletingMemberId === m.id}
                            onClick={() => p.onDeleteMember(m.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expenses</CardTitle>
                <CardDescription>
                  Track payments and split fairly.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_1fr_auto] gap-2">
                  <Input placeholder="Description" ref={expDescRef} />
                  <Input
                    placeholder="Amount"
                    type="number"
                    min="0"
                    step="0.01"
                    ref={expAmountRef}
                  />
                  <div>
                    <Label className="sr-only">Payer</Label>
                    <Select
                      value={payerId ? String(payerId) : undefined}
                      onValueChange={(v: string) => setPayerId(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Payer" />
                      </SelectTrigger>
                      <SelectContent>
                        {p.members.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    disabled={p.creatingExpense || !activeGroup}
                    onClick={async () => {
                      if (!activeGroup) return;
                      const desc = expDescRef.current?.value.trim() || "";
                      const amount = parseFloat(
                        expAmountRef.current?.value || "0"
                      );
                      const payer = payerId;
                      if (
                        !desc ||
                        !amount ||
                        !isFinite(amount) ||
                        amount <= 0 ||
                        !payer
                      )
                        return;
                      await p.onCreateExpense(desc, amount, payer);
                      if (expDescRef.current) expDescRef.current.value = "";
                      if (expAmountRef.current) expAmountRef.current.value = "";
                    }}
                  >
                    <Plus className="mr-2 size-4" /> Add Expense
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {p.expenses.length} total
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={p.onRefreshExpenses}
                  >
                    <RefreshCcw className="mr-2 size-4" />
                    Refresh
                  </Button>
                </div>

                <ul className="divide-y rounded-lg border">
                  {p.expenses.length === 0 ? (
                    <li className="p-4 text-sm text-neutral-500">
                      No expenses yet.
                    </li>
                  ) : (
                    p.expenses.map((x) => {
                      const payer = p.members.find((m) => m.id === x.payer_id);
                      return (
                        <li
                          key={x.id}
                          className="flex items-center justify-between p-2"
                        >
                          <div className="truncate">
                            <span className="font-medium">
                              {payer?.name ?? `#${x.payer_id}`}
                            </span>{" "}
                            <span className="text-neutral-600">paid</span>{" "}
                            <span className="font-medium">{fmt(x.amount)}</span>{" "}
                            <span className="text-neutral-500">
                              — {x.description}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">#{x.id}</Badge>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="size-8"
                              disabled={p.deletingExpenseId === x.id}
                              onClick={() => p.onDeleteExpense(x.id)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Balances */}
          <TabsContent value="balances">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="size-5 text-blue-600" />
                  Balances
                </CardTitle>
                <CardDescription>Who owes, and who is owed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={p.onRefreshBalances}
                  >
                    <RefreshCcw className="mr-2 size-4" />
                    Refresh
                  </Button>
                </div>
                <ul className="divide-y rounded-lg border">
                  {p.balances.length === 0 ? (
                    <li className="p-4 text-sm text-neutral-500">
                      No balances yet.
                    </li>
                  ) : (
                    p.balances.map((b) => (
                      <li
                        key={b.member_id}
                        className="flex items-center justify-between p-2"
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
                    ))
                  )}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
