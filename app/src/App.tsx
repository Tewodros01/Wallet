import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SignIn from "./page/SignIn";
import SignUp from "./page/SignUp";
import { useAuthStore } from "./store/auth.store";

const App = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <div className="text-white p-8">Dashboard (coming soon)</div>
            ) : (
              <Navigate to="/signin" replace />
            )
          }
        />
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
