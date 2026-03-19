import { api } from "../lib/axios";

export type PaymentMethod = "TELEBIRR" | "CBE_BIRR" | "BANK_CARD";

export interface DepositPayload {
  amount: number;
  method: PaymentMethod;
  reference?: string;
  proofUrl?: string;
}

export interface WithdrawalPayload {
  amount: number;
  method: PaymentMethod;
  accountNumber: string;
}

export interface TransferPayload {
  recipientUsername: string;
  amount: number;
}

export const paymentsApi = {
  getAgents: () => api.get("/payments/agents").then((r) => r.data),
  deposit: (payload: DepositPayload) =>
    api.post("/payments/deposit", payload).then((r) => r.data),
  getDeposits: () => api.get("/payments/deposits").then((r) => r.data),
  withdraw: (payload: WithdrawalPayload) =>
    api.post("/payments/withdraw", payload).then((r) => r.data),
  getWithdrawals: () => api.get("/payments/withdrawals").then((r) => r.data),
  transfer: (payload: TransferPayload) =>
    api.post("/payments/transfer", payload).then((r) => r.data),
  claimDailyBonus: (coins: number) =>
    api.post("/payments/daily-bonus", { coins }).then((r) => r.data),
  playKeno: (bet: number, picks: number[]): Promise<{ matches: number; payout: number; bet: number; net: number; drawn: number[]; newBalance: number }> =>
    api.post("/payments/keno/play", { bet, picks }).then((r) => r.data),
  getAgentRequests: () => api.get("/payments/agent/requests").then((r) => r.data),
  agentApproveDeposit: (id: string) => api.post(`/payments/agent/deposits/${id}/approve`).then((r) => r.data),
  agentRejectDeposit:  (id: string) => api.post(`/payments/agent/deposits/${id}/reject`).then((r) => r.data),
  agentApproveWithdrawal: (id: string) => api.post(`/payments/agent/withdrawals/${id}/approve`).then((r) => r.data),
  agentRejectWithdrawal:  (id: string) => api.post(`/payments/agent/withdrawals/${id}/reject`).then((r) => r.data),
  // admin
  adminGetAllDeposits:    () => api.get("/payments/admin/deposits").then((r) => r.data),
  adminGetAllWithdrawals: () => api.get("/payments/admin/withdrawals").then((r) => r.data),
  adminApproveDeposit:    (id: string) => api.post(`/payments/admin/deposits/${id}/approve`).then((r) => r.data),
  adminRejectDeposit:     (id: string) => api.post(`/payments/admin/deposits/${id}/reject`).then((r) => r.data),
  adminApproveWithdrawal: (id: string) => api.post(`/payments/admin/withdrawals/${id}/approve`).then((r) => r.data),
  adminRejectWithdrawal:  (id: string) => api.post(`/payments/admin/withdrawals/${id}/reject`).then((r) => r.data),
};
