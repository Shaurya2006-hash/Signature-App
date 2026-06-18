import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import UploadDocument from "./pages/UploadDocument";
import PublicSignPage from "./pages/PublicSignPage";

function App() {
  const token =
    localStorage.getItem("token");

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">

        <Routes>

          {/* Landing Page */}
          <Route
            path="/"
            element={
              token ? (
                <Dashboard />
              ) : (
                <Landing />
              )
            }
          />

          {/* Auth */}
          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* Upload */}
          <Route
            path="/upload"
            element={
              token ? (
                <UploadDocument />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          {/* Public Signature Link */}
          <Route
            path="/sign/:token"
            element={<PublicSignPage />}
          />

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to="/" />}
          />

        </Routes>

      </div>
    </BrowserRouter>
  );
}

export default App;