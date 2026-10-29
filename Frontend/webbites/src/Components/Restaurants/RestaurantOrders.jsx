import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import RestaurantSidebar from "./RestaurantSidebar";

const RestaurantOrders = () => {
    const navigate = useNavigate();
    const getAcceptanceTimeLeft = (createdAt) => {
        const elapsed = clockNow - new Date(createdAt).getTime();
        const remaining = Math.max(0, 60 * 60 * 1000 - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
    };
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersError, setOrdersError] = useState("");
    const [updatingOrderIds, setUpdatingOrderIds] = useState(() => new Set());
    const [statusMessage, setStatusMessage] = useState("");
    const [statusError, setStatusError] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedOrderId, setCopiedOrderId] = useState(null);
    const [copyError, setCopyError] = useState("");
    const [clockNow, setClockNow] = useState(Date.now());

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        setOrdersError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setOrdersError("Your session is missing. Please sign in again.");
                setOrders([]);
                return;
            }

            const response = await apiClient.get(
                "/api/restaurant/orders",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1 && Array.isArray(response.data.data)) {
                const newestFirst = [...response.data.data].sort((first, second) => {
                    const firstDate = new Date(first.createdAt).getTime();
                    const secondDate = new Date(second.createdAt).getTime();
                    const safeFirstDate = Number.isNaN(firstDate) ? 0 : firstDate;
                    const safeSecondDate = Number.isNaN(secondDate) ? 0 : secondDate;
                    return safeSecondDate - safeFirstDate;
                });
                setOrders(newestFirst.map((order) => ({
                    ...order,
                    items: Array.isArray(order.items) ? order.items : [],
                })));
            } else {
                setOrdersError("Unable to load orders. Please try again.");
            }

        } catch (error) {
            console.error(error);
            setOrdersError("Unable to load orders. Please check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    const copyOrderId = async (orderId) => {
        setCopyError("");

        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(String(orderId));
            } else {
                // Fallback for browsers or non-secure contexts without Clipboard API access.
                const temporaryInput = document.createElement("textarea");
                temporaryInput.value = String(orderId);
                temporaryInput.setAttribute("readonly", "");
                temporaryInput.style.position = "absolute";
                temporaryInput.style.left = "-9999px";
                document.body.appendChild(temporaryInput);
                temporaryInput.select();
                const copied = document.execCommand("copy");
                document.body.removeChild(temporaryInput);

                if (!copied) {
                    throw new Error("Clipboard copy was not accepted by the browser.");
                }
            }

            setCopiedOrderId(orderId);
            window.setTimeout(() => setCopiedOrderId((current) => current === orderId ? null : current), 1800);
        } catch (error) {
            console.error("Unable to copy order ID:", error);
            setCopyError("Unable to copy the order ID. Please select and copy it manually.");
        }
    };

    const updateStatus = async (orderId, status) => {
        if (updatingOrderIds.has(orderId)) return;

        const token = localStorage.getItem("token");
        if (!token) {
            setStatusError("Your session is missing. Please sign in again.");
            setStatusMessage("");
            return;
        }

        setUpdatingOrderIds((previous) => new Set(previous).add(orderId));
        setStatusMessage("");
        setStatusError("");

        try {
            const response = await apiClient.put(
                `/api/restaurant/orders/${orderId}/status`,
                {
                    status: status,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                const updatedStatus = response.data.data?.status || status;
                setOrders((prevOrders) =>
                    prevOrders.map((order) =>
                        order._id === orderId
                            ? { ...order, status: updatedStatus }
                            : order
                    )
                );

                setStatusMessage("Order status updated successfully.");
            } else {
                setStatusError(response.data.message || "Unable to update order status.");
            }

        } catch (error) {
            setStatusError(
                error.response?.data?.message ||
                "Unable to update order status. Please try again."
            );
        } finally {
            setUpdatingOrderIds((previous) => {
                const next = new Set(previous);
                next.delete(orderId);
                return next;
            });
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        const timer = window.setInterval(() => setClockNow(Date.now()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const orderStatuses = [
        "All",
        "Pending",
        "Accepted",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
    ];

    const filteredOrders = orders.filter((order) => {
        const matchesStatus = statusFilter === "All" || order.status === statusFilter;
        const search = searchTerm.trim().toLowerCase();
        const matchesSearch = !search || [
            order._id,
            order.customerId?.name,
            order.customerId?.email,
            order.customerId?.phone,
        ].some((value) => String(value || "").toLowerCase().includes(search));

        return matchesStatus && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-gray-500">
                    Loading orders...
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
                <Link to="/restaurant" className="text-2xl font-extrabold text-gray-900">Web<span className="text-red-500">Bites</span></Link>
                <div className="flex items-center gap-4"><span className="hidden text-sm text-gray-600 sm:inline">Restaurant Panel</span><button type="button" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Logout</button></div>
            </header>
            <div className="flex">
                <RestaurantSidebar />
                <main className="min-w-0 flex-1 px-6 py-8">
            <div className="mx-auto max-w-7xl">

                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
                            Restaurant
                        </p>

                        <h1 className="mt-2 text-3xl font-bold text-gray-900">
                            Orders
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage orders received from customers.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={fetchOrders}
                        disabled={loading}
                        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Refreshing..." : "Refresh Orders"}
                    </button>
                </div>

                {statusMessage && (
                    <div role="status" className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                        {statusMessage}
                    </div>
                )}

                {statusError && (
                    <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {statusError}
                    </div>
                )}

                {copyError && (
                    <div role="alert" className="mb-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                        {copyError}
                    </div>
                )}

                {ordersError ? (
                    <div className="rounded-2xl border border-red-200 bg-white p-10 text-center">
                        <h2 className="text-xl font-bold text-gray-800">
                            Couldn’t Load Orders
                        </h2>
                        <p className="mt-2 text-gray-500">{ordersError}</p>
                        <button
                            type="button"
                            onClick={fetchOrders}
                            className="mt-5 rounded-lg bg-red-500 px-5 py-2 font-semibold text-white hover:bg-red-600"
                        >
                            Try Again
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                        <div className="text-5xl">
                            📦
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-gray-800">
                            No Orders Yet
                        </h2>

                        <p className="mt-2 text-gray-500">
                            New customer orders will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                { label: "Total Orders", count: orders.length },
                                { label: "Pending", count: orders.filter((order) => order.status === "Pending").length },
                                { label: "Preparing", count: orders.filter((order) => order.status === "Preparing").length },
                                { label: "Out for Delivery", count: orders.filter((order) => order.status === "Out for Delivery").length },
                            ].map((summary) => (
                                <div key={summary.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                    <p className="text-sm font-medium text-gray-500">{summary.label}</p>
                                    <p className="mt-2 text-2xl font-bold text-gray-900">{summary.count}</p>
                                </div>
                            ))}
                        </div>

                        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
                            <input
                                type="search"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search by order ID, customer, email, or phone"
                                aria-label="Search restaurant orders"
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:border-red-300 hover:text-red-500"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>

                        <div className="mb-6 flex flex-wrap items-center gap-2">
                            {orderStatuses.map((status) => (
                                <button
                                    key={status}
                                    type="button"
                                    onClick={() => setStatusFilter(status)}
                                    aria-pressed={statusFilter === status}
                                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                        statusFilter === status
                                            ? "border-red-500 bg-red-500 text-white"
                                            : "border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-500"
                                    }`}
                                >
                                    {status} {status === "All" ? `(${orders.length})` : `(${orders.filter((order) => order.status === status).length})`}
                                </button>
                            ))}
                        </div>

                        <p className="mb-4 text-sm text-gray-500" aria-live="polite">
                            Showing {filteredOrders.length} of {orders.length} {orders.length === 1 ? "order" : "orders"}
                        </p>

                        {filteredOrders.length === 0 ? (
                            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                                <h2 className="text-xl font-bold text-gray-800">No Matching Orders</h2>
                                <p className="mt-2 text-gray-500">Try another search or status filter.</p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStatusFilter("All");
                                        setSearchTerm("");
                                    }}
                                    className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                                >
                                    View All Orders
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">

                        {filteredOrders.map((order) => (
                            <div
                                key={order._id}
                                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                            >

                                {/* Order Header */}
                                <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 md:flex-row">

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Order ID
                                        </p>

                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <p className="font-semibold text-gray-800">
                                                #{order._id}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => copyOrderId(order._id)}
                                                className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 transition hover:border-red-300 hover:text-red-500"
                                            >
                                                {copiedOrderId === order._id ? "Copied!" : "Copy ID"}
                                            </button>
                                        </div>

                                        <p className="mt-2 text-sm text-gray-500">
                                            {order.createdAt && !Number.isNaN(new Date(order.createdAt).getTime())
                                                ? new Date(order.createdAt).toLocaleString()
                                                : "Order date unavailable"}
                                        </p>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {order.items?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) || 0} {((order.items?.reduce((total, item) => total + (Number(item.quantity) || 0), 0) || 0) === 1) ? "item" : "items"}
                                        </p>
                                        {order.status === "Pending" && (
                                            <p className="mt-2 text-sm font-semibold text-amber-700">
                                                Accept within 1 hour. Time remaining: {getAcceptanceTimeLeft(order.createdAt)}
                                            </p>
                                        )}
                                        {order.status === "Cancelled" && order.cancellationReason && (
                                            <p className="mt-2 max-w-md text-sm text-red-600">Reason: {order.cancellationReason}</p>
                                        )}
                                    </div>

                                   <div className="flex flex-col items-start gap-3">

                                       <span
                                            className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                                order.status === "Cancelled"
                                                    ? "bg-red-100 text-red-600"
                                                    : order.status === "Delivered"
                                                    ? "bg-green-100 text-green-600"
                                                    : order.status === "Out for Delivery"
                                                    ? "bg-blue-100 text-blue-600"
                                                    : order.status === "Preparing"
                                                    ? "bg-orange-100 text-orange-600"
                                                    : order.status === "Accepted"
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-yellow-50 text-yellow-600"
                                            }`}
                                        >
                                            {order.status || "Status unavailable"}
                                        </span>

                                        {order.status === "Pending" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateStatus(order._id, "Accepted")
                                                }
                                                disabled={updatingOrderIds.has(order._id)}
                                                className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {updatingOrderIds.has(order._id) ? "Updating..." : "Accept Order"}
                                            </button>
                                        )}

                                        {order.status === "Accepted" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateStatus(order._id, "Preparing")
                                                }
                                                disabled={updatingOrderIds.has(order._id)}
                                                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {updatingOrderIds.has(order._id) ? "Updating..." : "Start Preparing"}
                                            </button>
                                        )}

                                        {order.status === "Preparing" && (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    updateStatus(order._id, "Out for Delivery")
                                                }
                                                disabled={updatingOrderIds.has(order._id)}
                                                className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {updatingOrderIds.has(order._id) ? "Updating..." : "Ready for Delivery"}
                                            </button>
                                        )}

                                        {["Pending", "Accepted", "Preparing"].includes(order.status) && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm("Cancel this order? This action cannot be undone.")) {
                                                        updateStatus(order._id, "Cancelled");
                                                    }
                                                }}
                                                disabled={updatingOrderIds.has(order._id)}
                                                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {updatingOrderIds.has(order._id) ? "Updating..." : "Cancel Order"}
                                            </button>
                                        )}

                                    </div>

                                </div>

                                {/* Customer */}
                                <div className="mt-5 grid gap-5 md:grid-cols-2">

                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            Customer
                                        </h3>

                                        <p className="mt-2 text-sm text-gray-600">
                                            {order.customerId?.name || "Customer"}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {order.customerId?.email || ""}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {order.customerId?.phone || ""}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            Delivery Address
                                        </h3>

                                        <p className="mt-2 text-sm text-gray-500">
                                            {order.deliveryAddress || "Delivery address unavailable"}
                                        </p>
                                    </div>

                                </div>

                                {/* Items */}
                                <div className="mt-6">

                                    <h3 className="font-semibold text-gray-800">
                                        Ordered Items
                                    </h3>

                                    <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">

                                        {order.items.length === 0 ? (
                                            <p className="px-4 py-4 text-sm text-gray-500">Item details are unavailable for this order.</p>
                                        ) : order.items.map((item, index) => (
                                            <div
                                                key={item.productId || `${order._id}-item-${index}`}
                                                className="flex items-center justify-between border-b border-gray-200 px-4 py-4 last:border-b-0"
                                            >

                                                <div>
                                                    <p className="font-medium text-gray-800">
                                                        {item.productName || "Unnamed product"}
                                                    </p>

                                                    <p className="text-sm text-gray-500">
                                                        ₹{Number(item.price) || 0} × {Number(item.quantity) || 0}
                                                    </p>
                                                </div>

                                                <p className="font-semibold text-gray-800">
                                                    ₹{Number(item.subtotal) || (Number(item.price) || 0) * (Number(item.quantity) || 0)}
                                                </p>

                                            </div>
                                        ))}

                                    </div>

                                </div>

                                {/* Payment Details */}
                                <div className="mt-5 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                    <p>
                                        Payment Method: {order.paymentMethod === "Online"
                                            ? "Online Payment"
                                            : order.paymentMethod === "COD"
                                            ? "Cash on Delivery"
                                            : "Payment method unavailable"}
                                    </p>
                                    <p className="mt-1">
                                        Payment Status: {order.paymentStatus || "Pending"}
                                    </p>
                                </div>

                                {/* Total */}
                                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-5">

                                    <span className="text-lg font-bold text-gray-900">
                                        Total
                                    </span>

                                    <span className="text-xl font-bold text-red-500">
                                        ₹{Number(order.totalAmount) || 0}
                                    </span>

                                </div>

                            </div>
                        ))}

                            </div>
                        )}
                    </>
                )}

            </div>
                </main>
            </div>
        </div>
    );
};

export default RestaurantOrders;
