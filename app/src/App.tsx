import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useRealtimeNotifications } from "./hooks/useNotifications";
import ActiveSessions from "./page/ActiveSessions";
import AdminDeposits from "./page/AdminDeposits";
import AdminMissions from "./page/AdminMissions";
import AdminPanel from "./page/AdminPanel";
import AdminTournaments from "./page/AdminTournaments";
import AdminUsers from "./page/AdminUsers";
import AdminWithdrawals from "./page/AdminWithdrawals";
import AgentDeposit from "./page/AgentDeposit";
import AgentStats from "./page/AgentStats";
import BingoGame from "./page/BingoGame";
import ChangePassword from "./page/ChangePassword";
import DailyBonus from "./page/DailyBonus";
import Dashboard from "./page/Dashboard";
import DepositMoney from "./page/DepositMoney";
import EditProfile from "./page/EditProfile";
import ForgotPassword from "./page/ForgotPassword";
import GameHistory from "./page/GameHistory";
import GetMoney from "./page/GetMoney";
import Invite from "./page/Invite";
import Keno from "./page/Keno";
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
import TransferMoney from "./page/TransferMoney";
import UserProfile from "./page/UserProfile";
import WalletHistory from "./page/WalletHistory";
import { useAuthStore } from "./store/auth.store";

const App = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Connect notification socket only when authenticated
  useRealtimeNotifications();

  const guard = (el: React.ReactElement) => {
    if (!isAuthenticated) return <Navigate to="/signin" replace />;
    return el;
  };

  // Only redirect to onboarding from the dashboard entry point, not every route
  const dashboardGuard = () => {
    if (!isAuthenticated) return <Navigate to="/signin" replace />;
    if (user && !user.onboardingDone && !localStorage.getItem("onboarding_done")) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Dashboard />;
  };

  const adminGuard = (el: React.ReactElement) =>
    !isAuthenticated ? (
      <Navigate to="/signin" replace />
    ) : user?.role !== "ADMIN" ? (
      <Navigate to="/dashboard" replace />
    ) : (
      el
    );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/dashboard" element={dashboardGuard()} />
        <Route path="/game" element={guard(<BingoGame />)} />
        <Route path="/game/:id" element={guard(<BingoGame />)} />
        <Route path="/profile" element={guard(<Profile />)} />
        <Route path="/profile/:id" element={guard(<UserProfile />)} />
        <Route path="/edit-profile" element={guard(<EditProfile />)} />
        <Route path="/wallet" element={guard(<MyWallet />)} />
        <Route path="/deposit-money" element={guard(<DepositMoney />)} />
        <Route path="/get-money" element={guard(<GetMoney />)} />
        <Route path="/transfer" element={guard(<TransferMoney />)} />
        <Route path="/invite" element={guard(<Invite />)} />
        <Route path="/agent-deposit" element={guard(<AgentDeposit />)} />
        <Route path="/history" element={guard(<GameHistory />)} />
        <Route path="/settings" element={guard(<Settings />)} />
        <Route path="/change-password" element={guard(<ChangePassword />)} />
        <Route path="/language" element={guard(<Language />)} />
        <Route path="/active-sessions" element={guard(<ActiveSessions />)} />
        <Route path="/admin/users" element={adminGuard(<AdminUsers />)} />
        <Route path="/admin/panel" element={adminGuard(<AdminPanel />)} />
        <Route path="/admin/deposits" element={adminGuard(<AdminDeposits />)} />
        <Route
          path="/admin/withdrawals"
          element={adminGuard(<AdminWithdrawals />)}
        />
        <Route path="/admin/agents/:id" element={adminGuard(<AgentStats />)} />
        <Route
          path="/admin/tournaments"
          element={adminGuard(<AdminTournaments />)}
        />
        <Route path="/admin/missions" element={adminGuard(<AdminMissions />)} />
        <Route path="/leaderboard" element={guard(<Leaderboard />)} />
        <Route path="/tournament" element={guard(<Tournament />)} />
        <Route path="/missions" element={guard(<Missions />)} />
        <Route path="/notifications" element={guard(<Notifications />)} />
        <Route path="/daily-bonus" element={guard(<DailyBonus />)} />
        <Route path="/wallet-history" element={guard(<WalletHistory />)} />
        <Route path="/onboarding" element={guard(<Onboarding />)} />
        <Route path="/keno" element={guard(<Keno />)} />
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? "/dashboard" : "/signin"} replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
