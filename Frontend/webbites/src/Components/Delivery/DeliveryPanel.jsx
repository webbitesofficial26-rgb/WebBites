import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import DeliverySidebar from "./DeliverySidebar";
import DeliveryHeader from "./DeliveryHeader";
import DeliveryGeminiChat from "./DeliveryGeminiChat";

const DeliveryPanel = () => {
  const navigate = useNavigate();
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        const response = await apiClient.get("/api/delivery/info", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status === 1) setDeliveryInfo(response.data.data);
        else setErrorMessage(response.data.message || "Unable to load dashboard information.");
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/delivery/login", { replace: true });
          return;
        }
        setErrorMessage("Unable to load dashboard information. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [token, navigate]);

  const stats = deliveryInfo?.stats || {};
  const cards = [
    { label: "Available Deliveries", value: stats.availableOrders ?? 0, to: "/delivery/get-deliveries", icon: "📦", note: "Find orders to deliver" },
    { label: "My Active Deliveries", value: stats.activeDeliveries ?? 0, to: "/delivery/my-deliveries", icon: "🚚", note: "Manage accepted orders" },
    { label: "Completed Deliveries", value: stats.completedDeliveries ?? 0, to: "/delivery/my-deliveries", icon: "✅", note: "View delivery history" },
    { label: "Total Earnings", value: `₹${stats.totalEarnings ?? 0}`, to: "/delivery/my-deliveries", icon: "💰", note: "From completed deliveries" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-gray-100">
      <DeliveryHeader title="Delivery Dashboard" subtitle="Your delivery overview" />
      <div className="flex flex-1 flex-col md:flex-row">
        <DeliverySidebar />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-semibold uppercase tracking-wider text-red-500">Overview</p><h1 className="mt-1 text-3xl font-extrabold text-gray-900">Welcome to your dashboard</h1><p className="mt-2 text-gray-600">Choose a section below to manage your deliveries.</p></div>
          </div>
          {loading && <p className="mb-5 rounded-xl bg-white p-5 text-gray-500 shadow-sm">Loading dashboard...</p>}
          {errorMessage && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage} <button onClick={() => window.location.reload()} className="ml-2 font-bold underline">Retry</button></div>}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => <Link key={card.label} to={card.to} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex items-start justify-between"><span className="text-sm font-semibold text-gray-500">{card.label}</span><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl">{card.icon}</span></div>
              <p className="mt-5 text-3xl font-extrabold text-gray-900">{card.value}</p><p className="mt-2 text-sm text-gray-500">{card.note}</p><p className="mt-5 text-sm font-bold text-red-500 group-hover:text-red-600">Open section →</p>
            </Link>)}
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <Link to="/delivery/get-deliveries" className="rounded-2xl bg-gray-950 p-6 text-white shadow-sm transition hover:bg-gray-900"><p className="text-2xl">📦</p><h2 className="mt-3 text-xl font-bold">Get Deliveries</h2><p className="mt-2 text-sm text-gray-300">Browse available orders and accept a delivery.</p><span className="mt-5 inline-block rounded-lg bg-red-500 px-4 py-2 text-sm font-bold">Browse available orders</span></Link>
            <Link to="/delivery/my-deliveries" className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-red-200 hover:shadow-md"><p className="text-2xl">🚚</p><h2 className="mt-3 text-xl font-bold text-gray-900">My Deliveries</h2><p className="mt-2 text-sm text-gray-600">Complete accepted deliveries, verify OTPs for online orders, and review completed deliveries.</p><span className="mt-5 inline-block rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white">Manage my deliveries</span></Link>
          </div>
        </main>
      </div>
      <DeliveryGeminiChat />
    </div>
  );
};

export default DeliveryPanel;
