import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { authApi } from "./api/auth.api";
import {
  AppEntryRedirect,
  DashboardEntryRoute,
  RequireAdmin,
  RequireAuth,
} from "./components/routing/RouteGuards";
import { APP_ROUTES } from "./config/routes";
import { useRealtimeNotifications } from "./hooks/useNotifications";
import {
  getTelegramInitData,
  isTelegramMiniApp,
  prepareTelegramWebApp,
} from "./lib/telegram";
import ActiveSessions from "./page/ActiveSessions";
import AdminAnalytics from "./page/AdminAnalytics";
import AdminDeposits from "./page/AdminDeposits";
import AdminMissions from "./page/AdminMissions";
import AdminPanel from "./page/AdminPanel";
import AdminTournaments from "./page/AdminTournaments";
import AdminUserDetail from "./page/AdminUserDetail";
import AdminUsers from "./page/AdminUsers";
import AdminWithdrawals from "./page/AdminWithdrawals";
import AgentDeposit from "./page/AgentDeposit";
import AgentStats from "./page/AgentStats";
import BingoGame from "./page/BingoGame";
import ChangePassword from "./page/ChangePassword";
import DailyBonus from "./page/DailyBonus";
import DepositMoney from "./page/DepositMoney";
import EditProfile from "./page/EditProfile";
import ForgotPassword from "./page/ForgotPassword";
import GameHistory from "./page/GameHistory";
import GetMoney from "./page/GetMoney";
import Invite from "./page/Invite";
import Keno from "./page/Keno";
import KenoHistory from "./page/KenoHistory";
import Language from "./page/Language";
import Leaderboard from "./page/Leaderboard";
import Missions from "./page/Missions";
import MyWallet from "./page/MyWallet";
import Notifications from "./page/Notifications";
import Onboarding from "./page/Onboarding";
import Profile from "./page/Profile";
import Settings from "./page/Settings";
import SignIn from "./page/SignIn";
import SignUp from "./page/SignUp";
import Tournament from "./page/Tournament";
import TransactionReceipt from "./page/TransactionReceipt";
import TransferMoney from "./page/TransferMoney";
import UserDetail from "./page/UserDetail";
import UserProfile from "./page/UserProfile";
import WalletHistory from "./page/WalletHistory";
import WithdrawalStatus from "./page/WithdrawalStatus";
import { useAuthStore } from "./store/auth.store";

const App = () => {
  useRealtimeNotifications();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuth = useAuthStore((s) => s.setAuth);
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
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center">
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
