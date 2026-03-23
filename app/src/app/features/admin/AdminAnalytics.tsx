import {
  FiActivity,
  FiArrowLeft,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAdminAnalytics, useAdminDeposits, useAdminWithdrawals, useAllUsers } from "./hooks";
import type { AdminUserBreakdown } from "../../../types";
import type { AdminDeposit, AdminWithdrawal } from "../../../types/admin.types";
import type { ApiAnalyticsPoint } from "../../../types/withdrawal.types";
import { AppBar } from "../../components/ui/Layout";

interface ChartTooltipEntry {
  name: string;
  color: string;
  value: number | string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function fmtK(v: number) {
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: ChartTooltipEntry) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name}: {Number(p.value).toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const { data: analytics = [], isLoading } = useAdminAnalytics();
  const { data: deposits = [] } = useAdminDeposits();
  const { data: withdrawals = [] } = useAdminWithdrawals();
  const { data: users = [] } = useAllUsers();
  const agents = users.filter((user) => user.role === "AGENT");
  const admins = users.filter((user) => user.role === "ADMIN");
  const regular = users.filter((user) => user.role === "USER");

  const chartData = analytics.map((d: ApiAnalyticsPoint) => ({
    ...d,
    date: fmtDate(d.date),
  }));

  const totalDeposits = deposits
    .filter((d: AdminDeposit) => d.status === "COMPLETED")
    .reduce((s: number, d: AdminDeposit) => s + Number(d.amount), 0);
  const totalWithdrawals = withdrawals
    .filter((w: AdminWithdrawal) => w.status === "COMPLETED")
    .reduce((s: number, w: AdminWithdrawal) => s + Number(w.amount), 0);
  const pendingDeposits = deposits.filter(
    (d: AdminDeposit) => d.status === "PENDING",
  ).length;
  const pendingWds = withdrawals.filter(
    (w: AdminWithdrawal) => w.status === "PENDING" || w.status === "PROCESSING",
  ).length;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col text-white">
      <AppBar
        left={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Go back"
              title="Go back"
              className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors"
            >
              <FiArrowLeft className="text-white text-sm" />
            </button>
            <div>
              <p className="text-base font-black text-white leading-tight">
                Analytics
              </p>
              <p className="text-[10px] text-gray-500">Last 30 days</p>
            </div>
          </div>
        }
        right={
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <FiTrendingUp className="text-emerald-400 text-sm" />
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4 pb-12 flex flex-col gap-5">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              label: "Total Deposited",
              value: totalDeposits.toLocaleString(),
              sub: `${pendingDeposits} pending`,
              icon: <FiTrendingUp className="text-emerald-300" />,
              bg: "bg-emerald-400/10 border-emerald-400/20",
            },
            {
              label: "Total Withdrawn",
              value: totalWithdrawals.toLocaleString(),
              sub: `${pendingWds} pending`,
              icon: <FiDollarSign className="text-orange-300" />,
              bg: "bg-orange-400/10 border-orange-400/20",
            },
            {
              label: "Total Users",
              value: users.length,
              sub: "all time",
              icon: <FiUsers className="text-cyan-300" />,
              bg: "bg-cyan-400/10 border-cyan-400/20",
            },
            {
              label: "Net Flow",
              value: (totalDeposits - totalWithdrawals).toLocaleString(),
              sub: "deposits − withdrawals",
              icon: <FiActivity className="text-violet-300" />,
              bg: "bg-violet-400/10 border-violet-400/20",
            },
          ].map(({ label, value, sub, icon, bg }) => (
            <div
              key={label}
              className={`${bg} border rounded-2xl p-3 flex flex-col gap-1.5`}
            >
              <span className="text-base">{icon}</span>
              <p className="text-lg font-black text-white leading-none">
                {String(value)}
                {label !== "Total Users" && (
                  <span className="ml-1 text-sm text-yellow-300">🪙</span>
                )}
              </p>
              <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
              <p className="text-[9px] text-gray-500">{sub}</p>
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 bg-white/4 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Coin flow chart */}
            <div className="bg-white/4 border border-white/7 rounded-2xl p-4">
              <p className="text-xs font-black text-white mb-1">Coin Flow</p>
              <p className="text-[10px] text-gray-500 mb-4">
                Deposits vs Withdrawals (completed)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gDeposit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gWithdraw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={fmtK}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="deposits"
                    name="Deposits"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gDeposit)"
                    dot={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="withdrawals"
                    name="Withdrawals"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    fill="url(#gWithdraw)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* New users chart */}
            <div className="bg-white/4 border border-white/7 rounded-2xl p-4">
              <p className="text-xs font-black text-white mb-1">
                New Registrations
              </p>
              <p className="text-[10px] text-gray-500 mb-4">
                Daily signups over last 30 days
              </p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6b7280", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    tick={{ fill: "#6b7280", fontSize: 9 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="newUsers"
                    name="New Users"
                    fill="#8b5cf6"
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/4 border border-white/7 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-black text-white mb-1">
                    User Breakdown
                  </p>
                  <p className="text-[10px] text-gray-500">
                    Distribution across all platform roles
                  </p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <FiUsers className="text-cyan-300 text-sm" />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {(
                  [
                    {
                      label: "Regular Users",
                      count: regular.length,
                      bar: "bg-linear-to-r from-blue-500 to-cyan-400",
                      pct: users.length
                        ? (regular.length / users.length) * 100
                        : 0,
                    },
                    {
                      label: "Agents",
                      count: agents.length,
                      bar: "bg-linear-to-r from-emerald-500 to-teal-400",
                      pct: users.length
                        ? (agents.length / users.length) * 100
                        : 0,
                    },
                    {
                      label: "Admins",
                      count: admins.length,
                      bar: "bg-linear-to-r from-yellow-500 to-amber-400",
                      pct: users.length
                        ? (admins.length / users.length) * 100
                        : 0,
                    },
                  ] as AdminUserBreakdown[]
                ).map(({ label, count, bar, pct }) => (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-gray-400 font-semibold">
                        {label}
                      </span>
                      <span className="text-xs font-black text-white">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${bar} rounded-full transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
