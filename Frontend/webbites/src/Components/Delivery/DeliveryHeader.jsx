import { Link, useNavigate } from "react-router-dom";

const DeliveryHeader = ({ title, subtitle }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/delivery/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex w-full flex-wrap items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 py-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 text-xl text-white">🚚</div>
        <div>
          <Link to="/delivery" className="text-lg font-extrabold tracking-tight text-gray-900">Web<span className="text-red-500">Bites</span> <span className="font-semibold text-gray-500">Delivery</span></Link>
          <p className="mt-0.5 text-sm text-gray-500">{title}{subtitle ? ` · ${subtitle}` : ""}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link to="/delivery/get-deliveries" className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Get Deliveries</Link>
        <Link to="/delivery/my-deliveries" className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">My Deliveries</Link>
        <Link to="/delivery/profile" className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">My Profile</Link>
        <button type="button" onClick={handleLogout} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600">Logout</button>
      </div>
    </header>
  );
};

export default DeliveryHeader;
