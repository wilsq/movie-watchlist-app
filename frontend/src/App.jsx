import { BrowserRouter, Routes, Route } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import WatchedPage from "./pages/WatchedPage";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/watched" element={<WatchedPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
