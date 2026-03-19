import { BrowserRouter, Route, Routes } from "react-router-dom";
import {
  AppEntryRedirect,
  DashboardEntryRoute,
  RequireAdmin,
  RequireAuth,
} from "./components/routing/RouteGuards";
import { APP_ROUTES } from "./config/routes";
import { useRealtimeNotifications } from "./hooks/useNotifications";
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

const App = () => {
  // Connect notification socket only when authenticated
  useRealtimeNotifications();

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
