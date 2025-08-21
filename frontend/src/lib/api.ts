// api.ts (typed version)
import axios from "axios";

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

export type CreateGroupDto = { name: string };
export type CreateMemberDto = { name: string; email: string };
export type CreateExpenseDto = {
  description: string;
  amount: number;
  payer_id: number;
  shares: { member_id: number; share: number }[];
};
export type UpdateExpenseDto = {
  description?: string;
  amount?: number;
  payer_id?: number;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
  // withCredentials: true, // uncomment if your backend uses cookie auth
});

// Groups
export function getGroups() {
  return api.get<Group[]>("/groups");
}
export function createGroup(payload: CreateGroupDto) {
  return api.post<Group>("/groups", payload);
}
export function deleteGroup(groupId: number) {
  return api.delete<void>(`/groups/${groupId}`);
}

// Members
export function getMembers(groupId: number) {
  return api.get<Member[]>(`/groups/${groupId}/members`);
}
export function createMember(groupId: number, payload: CreateMemberDto) {
  return api.post<Member>(`/groups/${groupId}/members`, payload);
}
export function deleteMember(groupId: number, memberId: number) {
  return api.delete<void>(`/groups/${groupId}/members/${memberId}`);
}

// Expenses
export function getExpenses(groupId: number) {
  return api.get<Expense[]>(`/groups/${groupId}/expenses`);
}
export function createExpense(groupId: number, payload: CreateExpenseDto) {
  return api.post<Expense>(`/groups/${groupId}/expenses`, payload);
}
export function updateExpense(
  groupId: number,
  expenseId: number,
  payload: UpdateExpenseDto
) {
  return api.patch<Expense>(
    `/groups/${groupId}/expenses/${expenseId}`,
    payload
  );
}
export function deleteExpense(groupId: number, expenseId: number) {
  return api.delete<void>(`/groups/${groupId}/expenses/${expenseId}`);
}

// Balances
export function getBalances(groupId: number) {
  return api.get<Balance[]>(`/groups/${groupId}/balances`);
}

export default api;
