import { api } from "../lib/axios";
import { PaymentMethod } from "../types/enums";
import type {
  Agent,
  ApiAnalyticsPoint,
} from "../types/withdrawal.types";
import type {
  AdminDeposit,
  AdminWithdrawal,
} from "../types/admin.types";
import type { AgentRequests } from "../types/agent-requests.types";
import type {
  Deposit,
  Withdrawal,
} from "../types/payment.types";

export interface DepositPayload {
  amount: number;
  method: PaymentMethod;
  agentId: string;
  reference?: string;
  proofUrl?: string;
}

export interface WithdrawalPayload {
  amount: number;
  method: PaymentMethod;
  agentId: string;
  accountNumber: string;
}

export interface TransferPayload {
  recipientUsername: string;
  amount: number;
}

export const paymentsApi = {
  getAgents: () => api.get<Agent[]>("/payments/agents").then((r) => r.data),
  deposit: (payload: DepositPayload) =>
    api.post("/payments/deposit", payload).then((r) => r.data),
  getDeposits: (): Promise<Deposit[]> =>
    api.get("/payments/deposits").then((r) => r.data),
  withdraw: (payload: WithdrawalPayload) =>
    api.post("/payments/withdraw", payload).then((r) => r.data),
  getWithdrawals: (): Promise<Withdrawal[]> =>
    api.get("/payments/withdrawals").then((r) => r.data),
  transfer: (payload: TransferPayload) =>
    api.post("/payments/transfer", payload).then((r) => r.data),
  claimDailyBonus: () => api.post("/payments/daily-bonus").then((r) => r.data),
  playKeno: (bet: number, picks: number[]): Promise<{ matches: number; payout: number; bet: number; net: number; drawn: number[]; newBalance: number }> =>
    api.post("/payments/keno/play", { bet, picks }).then((r) => r.data),
  getKenoHistory: (): Promise<{ id: string; title: string; amount: number; type: string; createdAt: string }[]> =>
    api.get("/payments/keno/history").then((r) => r.data),
  getAgentRequests: (): Promise<AgentRequests> =>
    api.get("/payments/agent/requests").then((r) => r.data),
  uploadProof: (file: File): Promise<{ proofUrl: string }> => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/payments/proof/upload", form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
  },
  agentApproveDeposit: (id: string) => api.post(`/payments/agent/deposits/${id}/approve`).then((r) => r.data),
  agentRejectDeposit:  (id: string) => api.post(`/payments/agent/deposits/${id}/reject`).then((r) => r.data),
  agentApproveWithdrawal: (id: string) => api.post(`/payments/agent/withdrawals/${id}/approve`).then((r) => r.data),
  agentRejectWithdrawal:  (id: string) => api.post(`/payments/agent/withdrawals/${id}/reject`).then((r) => r.data),
  // admin
  adminGetAllDeposits: (): Promise<AdminDeposit[]> =>
    api.get("/payments/admin/deposits").then((r) => r.data),
  adminGetAllWithdrawals: (): Promise<AdminWithdrawal[]> =>
    api.get("/payments/admin/withdrawals").then((r) => r.data),
  adminGetAnalytics: (): Promise<ApiAnalyticsPoint[]> =>
    api.get("/payments/admin/analytics").then((r) => r.data),
  adminApproveDeposit:    (id: string) => api.post(`/payments/admin/deposits/${id}/approve`).then((r) => r.data),
  adminRejectDeposit:     (id: string) => api.post(`/payments/admin/deposits/${id}/reject`).then((r) => r.data),
  adminApproveWithdrawal: (id: string) => api.post(`/payments/admin/withdrawals/${id}/approve`).then((r) => r.data),
  adminRejectWithdrawal:  (id: string) => api.post(`/payments/admin/withdrawals/${id}/reject`).then((r) => r.data),
};
