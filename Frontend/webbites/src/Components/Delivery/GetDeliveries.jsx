import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import DeliverySidebar from "./DeliverySidebar";
import DeliveryHeader from "./DeliveryHeader";

const GetDeliveries = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [refresh, setRefresh] = useState(0);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchAvailableDeliveries = async () => {
      setLoading(true); setErrorMessage("");
      try {
        const response = await apiClient.get("/api/delivery/orders", { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.status === 1) setOrders(response.data.data || []);
        else setErrorMessage(response.data.message || "Unable to load available deliveries.");
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/delivery/login", { replace: true }); return; }
        setErrorMessage(error.response?.data?.message || "Unable to load available deliveries.");
      } finally { setLoading(false); }
    };
    fetchAvailableDeliveries();
  }, [token, refresh, navigate]);

  const handleAccept = async (orderId) => {
    setActionLoading(orderId); setActionMessage(""); setActionError(false);
    try {
      const response = await apiClient.put(`/api/delivery/orders/${orderId}/accept`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === 1) { setActionMessage("Delivery accepted successfully. You can now manage it under My Deliveries."); setRefresh((value) => value + 1); }
      else { setActionError(true); setActionMessage(response.data.message || "Failed to accept delivery."); }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/delivery/login", { replace: true }); return; }
      setActionError(true); setActionMessage(error.response?.data?.message || "Failed to accept delivery.");
    } finally { setActionLoading(""); }
  };

  return <div className="flex min-h-screen flex-col bg-gray-100"><DeliveryHeader title="Get Deliveries" subtitle="Browse available orders" /><div className="flex flex-1 flex-col md:flex-row"><DeliverySidebar /><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
    <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wider text-red-500">Available orders</p><h1 className="mt-1 text-3xl font-extrabold text-gray-900">Get Deliveries</h1><p className="mt-2 text-gray-600">Accept an available order to add it to My Deliveries.</p></div>
    {actionMessage && <div role={actionError ? "alert" : "status"} className={`mb-5 rounded-xl border p-4 ${actionError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{actionMessage} {!actionError && <button onClick={() => navigate("/delivery/my-deliveries")} className="ml-2 font-bold underline">Open My Deliveries</button>}</div>}
    {errorMessage && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage} <button onClick={() => setRefresh((value) => value + 1)} className="ml-2 font-bold underline">Retry</button></div>}
    {loading ? <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">Loading available deliveries...</div> : orders.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center"><span className="text-4xl">📦</span><h2 className="mt-3 text-xl font-bold text-gray-900">No deliveries available</h2><p className="mt-2 text-gray-500">There are no orders waiting for a delivery partner right now.</p><button onClick={() => setRefresh((value) => value + 1)} className="mt-5 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600">Refresh</button></div> : <div className="space-y-5">{orders.map((order) => <article key={order._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900">{order.restaurantId?.restaurantName || "Restaurant"}</h2><p className="mt-1 text-sm text-gray-500">{order.restaurantId?.address || "Restaurant address unavailable"}</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">₹{order.totalAmount}</span></div>
      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p><strong>Customer:</strong> {order.customerId?.name || "Customer"}</p><p><strong>Phone:</strong> {order.customerId?.phone || "Not available"}</p><p className="sm:col-span-2"><strong>Delivery address:</strong> {order.deliveryAddress}</p></div>
      <div className="mt-4 rounded-xl bg-gray-50 p-4"><p className="mb-2 font-semibold text-gray-800">Items</p>{order.items?.map((item, index) => <p key={`${order._id}-${index}`} className="text-sm text-gray-600">{item.productName} × {item.quantity}</p>)}</div>
      <button type="button" onClick={() => handleAccept(order._id)} disabled={actionLoading === order._id} className="mt-5 rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">{actionLoading === order._id ? "Accepting..." : "Accept Delivery"}</button>
    </article>)}</div>}
  </main></div></div>;
};
export default GetDeliveries;
