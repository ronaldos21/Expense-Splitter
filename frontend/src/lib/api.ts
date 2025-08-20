import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
});

//--Expenses--
export async function getExpenses(groupId: number) {
  return api.get(`/groups/${groupId}/expenses`);
}

export async function createExpense(
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

//--Balances--
export async function getBalances(groupId: number) {
  return api.get(`/groups/${groupId}/balances`);
}

export default api;
