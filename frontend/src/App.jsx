import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<div className="p-6">Search Page</div>} />
        <Route
          path="/watched"
          element={<div className="p-6">Watched Page</div>}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
