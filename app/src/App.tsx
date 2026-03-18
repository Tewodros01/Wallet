import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ActiveSessions from "./page/ActiveSessions";
import AgentDeposit from "./page/AgentDeposit";
import BingoGame from "./page/BingoGame";
import ChangePassword from "./page/ChangePassword";
import Dashboard from "./page/Dashboard";
import DepositMoney from "./page/DepositMoney";
import EditProfile from "./page/EditProfile";
import GameHistory from "./page/GameHistory";
import GetMoney from "./page/GetMoney";
import TransferMoney from "./page/TransferMoney";
import Leaderboard from "./page/Leaderboard";
import Tournament from "./page/Tournament";
import Missions from "./page/Missions";
import Notifications from "./page/Notifications";
import DailyBonus from "./page/DailyBonus";
import Onboarding from "./page/Onboarding";
import WalletHistory from "./page/WalletHistory";
import Keno from "./page/Keno";
import Invite from "./page/Invite";
import JoinRoom from "./page/JoinRoom";
import Language from "./page/Language";
import MyWallet from "./page/MyWallet";
import Profile from "./page/Profile";
import Settings from "./page/Settings";
import SignIn from "./page/SignIn";
import SignUp from "./page/SignUp";
import { useAuthStore } from "./store/auth.store";

const App = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const guard = (el: React.ReactElement) =>
    isAuthenticated ? el : <Navigate to="/signin" replace />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={guard(<Dashboard />)} />
        <Route path="/game" element={guard(<BingoGame />)} />
        <Route path="/join" element={guard(<JoinRoom />)} />
        <Route path="/profile" element={guard(<Profile />)} />
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
