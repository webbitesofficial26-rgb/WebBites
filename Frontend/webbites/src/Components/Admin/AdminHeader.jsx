import { Link, useNavigate } from "react-router-dom";

const AdminHeader = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/admin/login");
  };

  return (
    <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">

      <Link
        to="/"
        className="text-2xl font-extrabold text-gray-900"
      >
        Web<span className="text-red-500">Bites</span>
      </Link>

      <div className="flex items-center gap-4">

        <span className="text-sm text-gray-600">
          Admin
        </span>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          Logout
        </button>

      </div>

    </header>
  );
};

export default AdminHeader;