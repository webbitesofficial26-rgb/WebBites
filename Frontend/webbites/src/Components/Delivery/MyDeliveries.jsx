import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import DeliverySidebar from "./DeliverySidebar";
import DeliveryHeader from "./DeliveryHeader";

const MyDeliveries = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState(false);
  const [actionLoading, setActionLoading] = useState("");
  const [deliveryOtps, setDeliveryOtps] = useState({});
  const [refresh, setRefresh] = useState(0);
  const [clockNow, setClockNow] = useState(Date.now());
  const token = localStorage.getItem("token");

  useEffect(() => {
    const clock = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  useEffect(() => {
    const fetchMyDeliveries = async () => {
      setLoading(true); setErrorMessage("");
      try {
        const response = await apiClient.get("/api/delivery/my-orders", { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.status === 1) setOrders(response.data.data || []);
        else setErrorMessage(response.data.message || "Unable to load your deliveries.");
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/delivery/login", { replace: true }); return; }
        setErrorMessage(error.response?.data?.message || "Unable to load your deliveries.");
      } finally { setLoading(false); }
    };
    fetchMyDeliveries();
  }, [token, refresh, navigate]);

  const handleDelivered = async (order) => {
    const orderId = order._id;
    const otp = deliveryOtps[orderId] || "";
    if (order.paymentMethod === "Online" && !/^\d{6}$/.test(otp)) { const message = "Enter the 6-digit OTP provided by the customer for online orders."; setActionError(true); setActionMessage(message); window.alert(message); return; }
    setActionLoading(orderId); setActionMessage(""); setActionError(false);
    try {
      const response = await apiClient.put(`/api/delivery/orders/${orderId}/delivered`, order.paymentMethod === "Online" ? { otp } : {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === 1) { setActionMessage("Order marked as delivered."); setDeliveryOtps((previous) => { const next = { ...previous }; delete next[orderId]; return next; }); setRefresh((value) => value + 1); }
      else { setActionError(true); setActionMessage(response.data.message || "Failed to complete delivery."); }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/delivery/login", { replace: true }); return; }
      const message = error.response?.data?.message || "Failed to complete delivery."; setActionError(true); setActionMessage(message); if (order.paymentMethod === "Online" && /otp/i.test(message)) window.alert(message);
    } finally { setActionLoading(""); }
  };

  const activeDeliveries = orders.filter((order) => order.status === "Out for Delivery");
  const completedDeliveries = orders.filter((order) => order.status === "Delivered");
  const renderEmpty = (message) => <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">{message}</div>;
  const formatDeliveryTime = (deadline) => {
    if (!deadline) return "Deadline unavailable";
    const remaining = Math.max(0, new Date(deadline).getTime() - clockNow);
    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return remaining <= 0 ? "Time limit reached — delivery is being cancelled" : `${hours > 0 ? `${hours}h ` : ""}${minutes}m ${seconds}s remaining`;
  };
  const renderOrderDetails = (order) => <><p className="mt-3 text-sm"><strong>Customer:</strong> {order.customerId?.name || "Customer"}</p><p className="mt-1 text-sm"><strong>Delivery address:</strong> {order.deliveryAddress}</p><p className="mt-1 text-sm"><strong>Order amount:</strong> ₹{order.totalAmount}</p><div className="mt-4 rounded-xl bg-gray-50 p-4"><p className="mb-2 text-sm font-semibold">Items</p>{order.items?.map((item, index) => <p key={`${order._id}-${index}`} className="text-sm text-gray-600">{item.productName} × {item.quantity}</p>)}</div></>;

  return <div className="flex min-h-screen flex-col bg-gray-100"><DeliveryHeader title="My Deliveries" subtitle="Manage accepted orders and history" /><div className="flex flex-1 flex-col md:flex-row"><DeliverySidebar /><main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
    <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wider text-red-500">Your orders</p><h1 className="mt-1 text-3xl font-extrabold text-gray-900">My Deliveries</h1><p className="mt-2 text-gray-600">Track active orders and review completed deliveries.</p></div>
    {actionMessage && <div role={actionError ? "alert" : "status"} className={`mb-5 rounded-xl border p-4 ${actionError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`}>{actionMessage}</div>}
    {errorMessage && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{errorMessage} <button onClick={() => setRefresh((value) => value + 1)} className="ml-2 font-bold underline">Retry</button></div>}
    {loading ? <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">Loading your deliveries...</div> : <>
      <section className="mb-10"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-2xl font-bold text-gray-900">Active Deliveries <span className="ml-2 rounded-full bg-orange-100 px-2.5 py-1 text-sm text-orange-700">{activeDeliveries.length}</span></h2></div>
        {activeDeliveries.length === 0 ? renderEmpty("You don't have any active deliveries. Visit Get Deliveries to accept an order.") : <div className="space-y-5">{activeDeliveries.map((order) => <article key={order._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-gray-900">{order.restaurantId?.restaurantName || "Restaurant"}</h3><p className="mt-1 text-sm text-gray-500">Customer: {order.customerId?.name || "Customer"}</p></div><span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-700">{order.status}</span></div>{renderOrderDetails(order)}
          <div className={`mt-4 rounded-xl border p-3 text-sm ${order.deliveryDeadlineAt && new Date(order.deliveryDeadlineAt).getTime() <= clockNow ? "border-red-200 bg-red-50 text-red-700" : "border-amber-200 bg-amber-50 text-amber-800"}`}><p className="font-bold">Delivery time limit: 1 hour</p><p className="mt-1">{formatDeliveryTime(order.deliveryDeadlineAt)}</p><p className="mt-1 text-xs">Deadline: {order.deliveryDeadlineAt ? new Date(order.deliveryDeadlineAt).toLocaleString() : "Not available"}</p></div>
          {order.paymentMethod === "Online" ? <div className="mt-4 max-w-sm"><label htmlFor={`delivery-otp-${order._id}`} className="mb-1 block text-sm font-semibold text-gray-700">Customer delivery OTP</label><input id={`delivery-otp-${order._id}`} type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={deliveryOtps[order._id] || ""} onChange={(event) => setDeliveryOtps((previous) => ({ ...previous, [order._id]: event.target.value.replace(/\D/g, "").slice(0, 6) }))} placeholder="Enter 6-digit OTP" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:outline-none"/><p className="mt-1 text-xs text-gray-500">Ask the customer for the OTP emailed after online payment.</p></div> : <p className="mt-4 text-sm text-gray-500">Cash on Delivery: no OTP required.</p>}
          <button type="button" onClick={() => handleDelivered(order)} disabled={actionLoading === order._id} className="mt-4 rounded-lg bg-green-600 px-5 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60">{actionLoading === order._id ? "Updating..." : "Mark Delivered"}</button>
        </article>)}</div>}
      </section>
      <section><h2 className="mb-4 text-2xl font-bold text-gray-900">Completed Deliveries <span className="ml-2 rounded-full bg-green-100 px-2.5 py-1 text-sm text-green-700">{completedDeliveries.length}</span></h2>{completedDeliveries.length === 0 ? renderEmpty("No completed deliveries yet.") : <div className="space-y-4">{completedDeliveries.map((order) => <article key={order._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-bold text-gray-900">{order.restaurantId?.restaurantName || "Restaurant"}</h3><p className="mt-1 text-sm text-gray-500">Customer: {order.customerId?.name || "Customer"}</p></div><span className="rounded-full bg-green-50 px-3 py-1 text-sm font-bold text-green-700">Delivered</span></div><p className="mt-3 text-sm"><strong>Address:</strong> {order.deliveryAddress}</p><p className="mt-1 text-sm"><strong>Order amount:</strong> ₹{order.totalAmount}</p></article>)}</div>}</section>
    </>}
  </main></div></div>;
};
export default MyDeliveries;
