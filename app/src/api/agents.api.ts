import { api } from "../lib/axios";

export const agentsApi = {
  getMyInvite: () => api.get("/agents/my-invite").then((r) => r.data),
  getStats: () => api.get("/agents/stats").then((r) => r.data),
  useCode: (code: string) =>
    api.post("/agents/use-code", { code }).then((r) => r.data),
};
