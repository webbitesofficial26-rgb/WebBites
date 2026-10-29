import { Link, useLocation } from "react-router-dom";

const AdminSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <aside className="hidden min-h-[calc(100vh-73px)] w-64 bg-gray-950 p-5 md:block">
      <nav className="space-y-2">

        <Link
          to="/admin"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Dashboard
        </Link>

        <Link
          to="/admin/restaurants"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/restaurants")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Restaurants
        </Link>

       <Link
        to="/admin/orders"
        className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/orders")
            ? "bg-red-500 text-white"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
        >
        Orders
        </Link>

        <Link
          to="/admin/customers"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/customers")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Customers
        </Link>
        <Link
        to="/admin/delivery"
        className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/delivery")
            ? "bg-red-500 text-white"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
        >
        Delivery Partners
        </Link>
        <Link
        to="/admin/products"
        className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/products")
            ? "bg-red-500 text-white"
            : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`}
        >
        Manage Product
        </Link>
        
        <Link
          to="/admin/coupons"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/coupons")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Manage Coupons
        </Link>
        <Link
          to="/admin/offer-templates"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/offer-templates")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Offer Templates
        </Link>
        <Link
          to="/admin/returns"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
              isActive("/admin/returns")
                  ? "bg-red-500 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
      >
          Returns
      </Link>

        <Link
          to="/admin/reports"
          className={`block rounded-lg px-4 py-3 text-sm font-medium ${
            isActive("/admin/reports")
              ? "bg-red-500 text-white"
              : "text-gray-300 hover:bg-gray-800 hover:text-white"
          }`}
        >
          Reports & Performance
        </Link>

      </nav>
    </aside>
  );
};

export default AdminSidebar;