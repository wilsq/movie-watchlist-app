import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import WatchedPage from "./pages/WatchedPage";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/ToastContext";
import Toast from "./components/Toast";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedLayout from "./components/ProtectedLayout";

function App() {
  const token = localStorage.getItem("token");

  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Toast />
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<SearchPage />} />
              <Route path="/watched" element={<WatchedPage />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
