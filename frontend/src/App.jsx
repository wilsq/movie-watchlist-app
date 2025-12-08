import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import WatchedPage from "./pages/WatchedPage";
import Navbar from "./components/Navbar";
import { ToastProvider } from "./components/ToastContext";
import Toast from "./components/Toast";

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-slate-950 text-slate-100">
          <Navbar />
          <Toast />
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/watched" element={<WatchedPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
