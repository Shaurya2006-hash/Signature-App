import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import UploadDocument from "./pages/UploadDocument";
import SignDocument from "./pages/SignDocument";
function App() {
  const token =
    localStorage.getItem(
      "token"
    );

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />
<Route
  path="/sign/:token"
  element={<SignDocument />}
/>
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

        <Route
          path="/upload"
          element={
            token ? (
              <UploadDocument />
            ) : (
              <Navigate
                to="/login"
              />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;