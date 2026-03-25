import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { authApi } from "../api/auth.api";
import { APP_ROUTES } from "../config/routes";
import {
  getTelegramInitData,
  isTelegramMiniApp,
  prepareTelegramWebApp,
} from "../lib/telegram";
import { useRealtimeNotifications, useTheme } from "../hooks";
import { useAuthStore } from "../store/auth.store";
import { usePreferencesStore } from "../store/preferences.store";
import {
  AppEntryRedirect,
  DashboardEntryRoute,
  RequireAdmin,
  RequireAuth,
} from "./components/routing/RouteGuards";
import {
  AdminAnalytics,
  AdminDeposits,
  AdminMissions,
  AdminPanel,
  AdminRooms,
  AdminTournaments,
  AdminUserDetail,
  AdminUsers,
  AdminWithdrawals,
} from "./features/admin";
import { AgentDeposit, AgentStats } from "./features/agents";
import {
  ChangePassword,
  ForgotPassword,
  Onboarding,
  SignIn,
  SignUp,
} from "./features/auth";
import { BingoGame, GameHistory } from "./features/bingo";
import { DailyBonus, Leaderboard } from "./features/dashboard";
import { Keno, KenoDashboard, KenoHistory } from "./features/keno";
import { Missions } from "./features/missions";
import {
  ActiveSessions,
  EditProfile,
  Invite,
  Language,
  Notifications,
  Profile,
  Settings,
  UserDetail,
  UserProfile,
} from "./features/profile";
import { Tournament } from "./features/tournaments";
import {
  DepositMoney,
  GetMoney,
  MyWallet,
  TransactionReceipt,
  TransferMoney,
  WalletHistory,
  WithdrawalStatus,
} from "./features/wallet";

const App = () => {
  useRealtimeNotifications();
  useTheme(); // This handles theme application automatically
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
  const language = usePreferencesStore((s) => s.language);
  const telegramMiniApp = useMemo(() => isTelegramMiniApp(), []);
  const telegramInitData = useMemo(
    () => (telegramMiniApp ? getTelegramInitData() : ""),
    [telegramMiniApp],
  );
  const [telegramBootstrapStatus, setTelegramBootstrapStatus] = useState<
    "idle" | "loading" | "done"
  >(() =>
    !isAuthenticated && telegramMiniApp && telegramInitData
      ? "loading"
      : "done",
  );

  useEffect(() => {
    prepareTelegramWebApp();
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (isAuthenticated || !telegramMiniApp) {
      return;
    }
    if (!telegramInitData) {
      return;
    }

    let cancelled = false;

    void authApi
      .telegramLogin({ initData: telegramInitData })
      .then((data) => {
        if (cancelled) return;
        setAuth(data.user, data.access_token, data.refresh_token);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTelegramBootstrapStatus("done");
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setAuth, telegramInitData, telegramMiniApp]);

  const isBootstrappingTelegram =
    telegramBootstrapStatus === "loading" && !isAuthenticated;

  if (isBootstrappingTelegram) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/4 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/30 bg-cyan-500/10">
            <span className="text-2xl">📲</span>
          </div>
          <h1 className="text-xl font-black">Connecting Telegram</h1>
          <p className="mt-2 text-sm text-gray-400">
            We&apos;re signing you in through your Telegram Mini App session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path={APP_ROUTES.signin} element={<SignIn />} />
        <Route path={APP_ROUTES.signup} element={<SignUp />} />
        <Route path={APP_ROUTES.forgotPassword} element={<ForgotPassword />} />
        <Route path={APP_ROUTES.dashboard} element={<DashboardEntryRoute />} />
        <Route
          path={APP_ROUTES.game}
          element={
            <RequireAuth>
              <BingoGame />
            </RequireAuth>
          }
        />
        <Route
          path={`${APP_ROUTES.game}/:id`}
          element={
            <RequireAuth>
              <BingoGame />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.profile}
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path={`${APP_ROUTES.profile}/:id`}
          element={
            <RequireAuth>
              <UserProfile />
            </RequireAuth>
          }
        />
        <Route
          path={`${APP_ROUTES.user}/:id`}
          element={
            <RequireAuth>
              <UserDetail />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.editProfile}
          element={
            <RequireAuth>
              <EditProfile />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.wallet}
          element={
            <RequireAuth>
              <MyWallet />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.depositMoney}
          element={
            <RequireAuth>
              <DepositMoney />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.getMoney}
          element={
            <RequireAuth>
              <GetMoney />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.transfer}
          element={
            <RequireAuth>
              <TransferMoney />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.invite}
          element={
            <RequireAuth>
              <Invite />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.agentDeposit}
          element={
            <RequireAuth>
              <AgentDeposit />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.history}
          element={
            <RequireAuth>
              <GameHistory />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.settings}
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.changePassword}
          element={
            <RequireAuth>
              <ChangePassword />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.language}
          element={
            <RequireAuth>
              <Language />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.activeSessions}
          element={
            <RequireAuth>
              <ActiveSessions />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.admin.users}
          element={
            <RequireAdmin>
              <AdminUsers />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.panel}
          element={
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.rooms}
          element={
            <RequireAdmin>
              <AdminRooms />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.deposits}
          element={
            <RequireAdmin>
              <AdminDeposits />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.withdrawals}
          element={
            <RequireAdmin>
              <AdminWithdrawals />
            </RequireAdmin>
          }
        />
        <Route
          path={`${APP_ROUTES.admin.users}/:id`}
          element={
            <RequireAdmin>
              <AdminUserDetail />
            </RequireAdmin>
          }
        />
        <Route
          path={`${APP_ROUTES.admin.agents}/:id`}
          element={
            <RequireAdmin>
              <AgentStats />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.tournaments}
          element={
            <RequireAdmin>
              <AdminTournaments />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.missions}
          element={
            <RequireAdmin>
              <AdminMissions />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.admin.analytics}
          element={
            <RequireAdmin>
              <AdminAnalytics />
            </RequireAdmin>
          }
        />
        <Route
          path={APP_ROUTES.leaderboard}
          element={
            <RequireAuth>
              <Leaderboard />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.tournament}
          element={
            <RequireAuth>
              <Tournament />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.missions}
          element={
            <RequireAuth>
              <Missions />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.notifications}
          element={
            <RequireAuth>
              <Notifications />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.dailyBonus}
          element={
            <RequireAuth>
              <DailyBonus />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.walletHistory}
          element={
            <RequireAuth>
              <WalletHistory />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.withdrawalStatus}
          element={
            <RequireAuth>
              <WithdrawalStatus />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.onboarding}
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.keno}
          element={
            <RequireAuth>
              <KenoDashboard />
            </RequireAuth>
          }
        />
        <Route
          path={`${APP_ROUTES.kenoPlay}/:style`}
          element={
            <RequireAuth>
              <Keno />
            </RequireAuth>
          }
        />
        <Route
          path={APP_ROUTES.kenoHistory}
          element={
            <RequireAuth>
              <KenoHistory />
            </RequireAuth>
          }
        />
        <Route
          path={`${APP_ROUTES.transaction}/:id`}
          element={
            <RequireAuth>
              <TransactionReceipt />
            </RequireAuth>
          }
        />
        <Route path="*" element={<AppEntryRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
