export const paymentKeys = {
  all: ["payments"] as const,
  agents: () => [...paymentKeys.all, "agents"] as const,
  deposits: () => [...paymentKeys.all, "deposits"] as const,
  withdrawals: () => [...paymentKeys.all, "withdrawals"] as const,
  keno: {
    all: () => [...paymentKeys.all, "keno"] as const,
    history: () => [...paymentKeys.keno.all(), "history"] as const,
  },
  agent: {
    all: () => [...paymentKeys.all, "agent"] as const,
    requests: () => [...paymentKeys.agent.all(), "requests"] as const,
  },
  admin: {
    all: () => [...paymentKeys.all, "admin"] as const,
    deposits: () => [...paymentKeys.admin.all(), "deposits"] as const,
    withdrawals: () => [...paymentKeys.admin.all(), "withdrawals"] as const,
    analytics: () => [...paymentKeys.admin.all(), "analytics"] as const,
  },
} as const;
