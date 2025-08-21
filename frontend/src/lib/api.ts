import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

// ----- Groups -----
export function getGroups() {
  return api.get("/groups");
}
export function createGroup(payload: { name: string }) {
  return api.post("/groups", payload);
}

// --- Delete group
export function deleteGroup(groupId: number) {
  return api.delete(`/groups/${groupId}`);
}

// ----- Members -----
export function getMembers(groupId: number) {
  return api.get(`/groups/${groupId}/members`);
}
export function createMember(
  groupId: number,
  payload: { name: string; email: string }
) {
  return api.post(`/groups/${groupId}/members`, payload);
}

// --- Delete member
export function deleteMember(groupId: number, memberId: number) {
  return api.delete(`/groups/${groupId}/members/${memberId}`);
}

// ----- Expenses -----
export function getExpenses(groupId: number) {
  return api.get(`/groups/${groupId}/expenses`);
}
export function createExpense(
  groupId: number,
  payload: {
    description: string;
    amount: number;
    payer_id: number;
    shares: { member_id: number; share: number }[];
  }
) {
  return api.post(`/groups/${groupId}/expenses`, payload);
}
export function updateExpense(
  groupId: number,
  expenseId: number,
  payload: { description?: string; amount?: number; payer_id?: number }
) {
  return api.patch(`/groups/${groupId}/expenses/${expenseId}`, payload);
}
export function deleteExpense(groupId: number, expenseId: number) {
  return api.delete(`/groups/${groupId}/expenses/${expenseId}`);
}

// ----- Balances -----
export function getBalances(groupId: number) {
  return api.get(`/groups/${groupId}/balances`);
}

export default api;
