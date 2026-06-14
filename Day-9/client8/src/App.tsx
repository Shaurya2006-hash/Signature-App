import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import PublicSignPage from "./pages/PublicSignPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/sign/:token"
          element={<PublicSignPage />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;