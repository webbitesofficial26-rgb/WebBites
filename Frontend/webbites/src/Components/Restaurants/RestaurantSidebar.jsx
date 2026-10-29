import { Link, useLocation } from "react-router-dom";

const RestaurantSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="min-h-[calc(100vh-73px)] w-44 shrink-0 bg-gray-950 p-3 sm:w-56 sm:p-5 md:w-64">
      <nav className="space-y-2">

        <Link
          to="/restaurant"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/restaurant")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Dashboard
        </Link>

        <Link
          to="/restaurant/orders"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/restaurant/orders")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Orders
        </Link>

        <Link
          to="/restaurant/menu"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/restaurant/menu")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Menu
        </Link>

        <Link
          to="/restaurant/offers"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/restaurant/offers")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Offers & Promotions
        </Link>

        <Link
          to="/restaurant/profile"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/restaurant/profile")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Restaurant Profile
        </Link>

      </nav>
    </aside>
  );
};

export default RestaurantSidebar;