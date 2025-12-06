import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
      <div className="text-xl font-bold tracking-wide">Movie Watchlist</div>

      <div className="flex gap-6 text-lg">
        <Link to="/" className="hover:text-gray-300 transition-colors">
          Search
        </Link>
        <Link to="/watched" className="hover:text-gray-300 transition-colors">
          Watched
        </Link>
      </div>
    </nav>
  );
}
