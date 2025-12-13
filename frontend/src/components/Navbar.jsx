import { Link, useNavigate } from "react-router-dom";
import { useToast } from "./ToastContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    showToast("Logged out", "success");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <div className="text-xl font-bold tracking-wide">Movie Watchlist</div>

      <div className="flex items-center gap-6 text-lg">
        <Link to="/" className="hover:text-gray-300 transition-colors">
          Search
        </Link>

        {token && (
          <Link to="/watched" className="hover:text-gray-300 transition-colors">
            Watched
          </Link>
        )}

        {token ? (
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-800 px-3 py-1 text-sm hover:bg-gray-700 transition-colors"
          >
            Logout
          </button>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-md bg-gray-800 px-3 py-1 text-sm hover:bg-gray-700 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-md bg-emerald-500 px-3 py-1 text-sm text-slate-900 hover:bg-emerald-400 transition-colors"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
