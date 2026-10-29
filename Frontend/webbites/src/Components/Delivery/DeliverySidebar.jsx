import { Link, useLocation } from "react-router-dom";

const DeliverySidebar = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const linkClass = (active) => `block rounded-lg px-4 py-3 text-sm font-semibold transition ${active ? "bg-red-500 text-white shadow-sm" : "text-gray-300 hover:bg-gray-800 hover:text-white"}`;

  return <aside className="w-full shrink-0 bg-gray-950 p-3 md:min-h-[calc(100vh-77px)] md:w-64 md:p-5">
    <div className="mb-4 hidden border-b border-gray-800 px-3 pb-4 md:block"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Delivery workspace</p><p className="mt-1 text-sm text-gray-300">Manage your deliveries</p></div>
    <nav aria-label="Delivery navigation" className="flex flex-wrap gap-2 md:flex-col md:space-y-2">
      <Link to="/delivery" className={linkClass(isActive("/delivery"))}>Dashboard</Link>
      <Link to="/delivery/get-deliveries" className={linkClass(isActive("/delivery/get-deliveries"))}>Get Deliveries</Link>
      <Link to="/delivery/my-deliveries" className={linkClass(isActive("/delivery/my-deliveries"))}>My Deliveries</Link>
      <Link to="/delivery/profile" className={linkClass(isActive("/delivery/profile"))}>Profile & Password</Link>
    </nav>
  </aside>;
};
export default DeliverySidebar;
