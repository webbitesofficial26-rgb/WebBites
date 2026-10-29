import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import apiClient from "../../config/apiClient";

const MyOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ordersError, setOrdersError] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [fetchingOrders, setFetchingOrders] = useState(false);
    const fetchInProgress = useRef(false);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [copiedOrderId, setCopiedOrderId] = useState("");

    const [showReview, setShowReview] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const [returnOrderId, setReturnOrderId] = useState(null);
    const [returnReason, setReturnReason] = useState("");
    const [returnLoading, setReturnLoading] = useState(false);
    const [cancelingOrderId, setCancelingOrderId] = useState(null);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewError, setReviewError] = useState("");
    const [returnError, setReturnError] = useState("");

    const fetchOrders = async () => {
        // Avoid overlapping automatic, manual, or action-triggered requests.
        if (fetchInProgress.current) {
            return false;
        }

        fetchInProgress.current = true;
        setFetchingOrders(true);

        try {
            const token = localStorage.getItem("token");

            const response = await apiClient.get(
                "/api/customer/orders",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1 && Array.isArray(response.data.data)) {
                setOrders(response.data.data);
                setOrdersError("");
                setLastUpdated(new Date());
                return true;
            }

            setOrdersError(response.data.message || "Unable to load your orders. Please try again.");
            return false;
        } catch (error) {
            console.error(error);
            setOrdersError(error.response?.data?.message || "Unable to load your orders. Please check your connection and try again.");
            return false;
        } finally {
            setLoading(false);
            setFetchingOrders(false);
            fetchInProgress.current = false;
        }
    };

    useEffect(() => {
        fetchOrders();

        const interval = setInterval(() => {
            fetchOrders();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handleRefreshOrders = async () => {
        if (fetchInProgress.current) {
            return;
        }

        setRefreshing(true);
        try {
            await fetchOrders();
        } finally {
            setRefreshing(false);
        }
    };

    const filteredOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .filter((order) => {
            const matchesStatus = statusFilter === "All"
                || (statusFilter === "In Progress"
                    ? ["Pending", "Accepted", "Preparing", "Out for Delivery"].includes(order.status)
                    : order.status === statusFilter);

            const query = searchTerm.trim().toLowerCase();
            const matchesSearch = !query
                || String(order._id || "").toLowerCase().includes(query)
                || (Array.isArray(order.items) && order.items.some((item) =>
                    String(item.productName || "").toLowerCase().includes(query)
                ));

            return matchesStatus && matchesSearch;
        });

    const copyOrderId = async (orderId) => {
        try {
            await navigator.clipboard.writeText(orderId);
            setCopiedOrderId(orderId);
            setTimeout(() => setCopiedOrderId(""), 2000);
        } catch (error) {
            console.error("Could not copy order ID:", error);
            window.alert("Could not copy the order ID. Please select and copy it manually.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "Pending":
                return "bg-yellow-100 text-yellow-700";

            case "Accepted":
                return "bg-blue-100 text-blue-700";

            case "Preparing":
                return "bg-orange-100 text-orange-700";

            case "Out for Delivery":
                return "bg-purple-100 text-purple-700";

            case "Delivered":
                return "bg-green-100 text-green-700";

            case "Cancelled":
                return "bg-red-100 text-red-700";

            default:
                return "bg-gray-100 text-gray-700";
        }
    };

    const getStatusStep = (status) => {
        const statuses = [
            "Pending",
            "Accepted",
            "Preparing",
            "Out for Delivery",
            "Delivered",
        ];

        return statuses.indexOf(status);
    };
    const handleCancelOrder = async (orderId) => {
        if (cancelingOrderId) return;

        const confirmCancel = window.confirm(
            "Are you sure you want to cancel this order?"
        );
        if (!confirmCancel) return;

        setCancelingOrderId(orderId);
        try {
            const token = localStorage.getItem("token");
            const response = await apiClient.put(
                `/api/customer/orders/${orderId}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 1) {
                window.alert("Order cancelled successfully.");
                await fetchOrders();
            } else {
                window.alert(response.data.message || "Unable to cancel order.");
            }
        } catch (error) {
            window.alert(error.response?.data?.message || "Unable to cancel order. Please try again.");
        } finally {
            setCancelingOrderId(null);
        }
    };

    const handleSubmitReview = async () => {
        if (reviewSubmitting || !selectedOrder || !comment.trim()) return;

        setReviewSubmitting(true);
        setReviewError("");
        try {
            const token = localStorage.getItem("token");
            const response = await apiClient.post(
                "/api/reviews",
                {
                    orderId: selectedOrder._id,
                    rating,
                    comment: comment.trim(),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.status === 1) {
                window.alert("Review submitted successfully.");
                setShowReview(false);
                setSelectedOrder(null);
                setRating(5);
                setComment("");
            } else {
                setReviewError(response.data.message || "Failed to submit review.");
            }
        } catch (error) {
            setReviewError(error.response?.data?.message || "Failed to submit review. Please try again.");
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleReturnRequest = async (e) => {
        e.preventDefault();

        if (returnLoading) return;
        if (!returnReason.trim()) {
            setReturnError("Please provide a reason for returning the order.");
            return;
        }

        setReturnError("");
        try {
            setReturnLoading(true);

            const token = localStorage.getItem("token");

            const response = await apiClient.put(
            `/api/customer/orders/${returnOrderId}/return`,
            { returnReason: returnReason.trim() },
            {
                headers: {
                Authorization: `Bearer ${token}`,
                },
            }
            );

            if (response.data.status === 1) {
            window.alert("Return request submitted successfully!");
            setReturnOrderId(null);
            setReturnError("");
            setReturnReason("");

            // Refresh the orders using your existing fetch function.
            // Replace fetchOrders with your actual function name.
            await fetchOrders();
            } else {
            setReturnError(response.data.message || "Failed to submit return request.");
            }
        } catch (error) {
            setReturnError(error.response?.data?.message || "Something went wrong while requesting the return.");
        } finally {
            setReturnLoading(false);
        }
        };
    return (
        <div className="min-h-screen bg-gray-100">

            {/* Header */}
            <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">

                <Link
                    to="/"
                    className="text-2xl font-extrabold text-gray-900"
                >
                    Web<span className="text-red-500">Bites</span>
                </Link>

                <div className="flex items-center gap-4">

                    <Link
                        to="/cust-viewrestaurant"
                        className="text-sm font-medium text-gray-600 hover:text-red-500"
                    >
                        Restaurants
                    </Link>

                    <Link
                        to="/cart"
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                        Cart
                    </Link>

                </div>

            </header>

            {/* Main */}
            <main className="mx-auto max-w-6xl p-4 sm:p-6 md:p-8">

                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        My Orders
                    </h1>

                    <p className="mt-2 text-gray-500">
                        View your orders and track their status.
                    </p>
                </div>

                {/* Loading */}
                {loading ? (

                    <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">

                        <p className="text-gray-500">
                            Loading your orders...
                        </p>

                    </div>

                ) : ordersError && orders.length === 0 ? (

                    /* Order loading error */
                    <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">
                        <p className="font-semibold text-red-600">Could not load your orders</p>
                        <p className="mt-2 text-gray-500">{ordersError}</p>
                        <button
                            type="button"
                            onClick={fetchOrders}
                            className="mt-5 rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600"
                        >
                            Try Again
                        </button>
                    </div>

                ) : orders.length === 0 ? (

                    /* No orders */
                    <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">

                        <div className="text-6xl">
                            🛍️
                        </div>

                        <h2 className="mt-4 text-xl font-bold text-gray-800">
                            No Orders Yet
                        </h2>

                        <p className="mt-2 text-gray-500">
                            You haven't placed any orders yet.
                        </p>

                        <Link
                            to="/cust-viewrestaurant"
                            className="mt-6 inline-block rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600"
                        >
                            Browse Restaurants
                        </Link>

                    </div>

                ) : (

                    /* Orders */
                    <div className="mt-8 space-y-6">

                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <p className="text-sm text-gray-500">Total Orders</p>
                                <p className="mt-1 text-2xl font-bold text-gray-800">{orders.length}</p>
                            </div>
                            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
                                <p className="text-sm text-yellow-800">In Progress</p>
                                <p className="mt-1 text-2xl font-bold text-yellow-900">
                                    {orders.filter((order) => ["Pending", "Accepted", "Preparing", "Out for Delivery"].includes(order.status)).length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
                                <p className="text-sm text-green-800">Delivered</p>
                                <p className="mt-1 text-2xl font-bold text-green-900">
                                    {orders.filter((order) => order.status === "Delivered").length}
                                </p>
                            </div>
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
                                <p className="text-sm text-red-800">Cancelled</p>
                                <p className="mt-1 text-2xl font-bold text-red-900">
                                    {orders.filter((order) => order.status === "Cancelled").length}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-600">
                                    Showing {filteredOrders.length} of {orders.length} orders
                                </p>
                                {lastUpdated && (
                                    <p className="mt-1 text-xs text-gray-500" aria-live="polite">
                                        Last updated: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                    </p>
                                )}
                                <button
                                    type="button"
                                    onClick={handleRefreshOrders}
                                    disabled={refreshing || fetchingOrders}
                                    className="mt-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {refreshing || fetchingOrders ? "Refreshing..." : "Refresh Orders"}
                                </button>
                            </div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <label className="sr-only" htmlFor="my-orders-search">Search orders</label>
                                <input
                                    id="my-orders-search"
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search by order ID or item..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 sm:w-64"
                                />
                                {(searchTerm || statusFilter !== "All") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("All");
                                        }}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Clear search &amp; filters
                                    </button>
                                )}
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                Filter orders
                                <select
                                    value={statusFilter}
                                    onChange={(event) => setStatusFilter(event.target.value)}
                                    className="rounded-lg border border-gray-300 bg-white px-3 py-2"
                                >
                                    <option value="All">All Orders</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Delivered">Delivered</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                                </label>
                            </div>
                        </div>

                        {filteredOrders.length === 0 && (
                            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                                <p className="font-semibold text-gray-800">
                                    {searchTerm.trim()
                                        ? "No matching orders found"
                                        : "No orders in this category"}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {searchTerm.trim()
                                        ? "Try a different order ID or item name, or clear your search and filters."
                                        : "Choose another filter to see your orders."}
                                </p>
                                {(searchTerm || statusFilter !== "All") && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchTerm("");
                                            setStatusFilter("All");
                                        }}
                                        className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                                    >
                                        View All Orders
                                    </button>
                                )}
                            </div>
                        )}

                        {ordersError && (
                            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                                We couldn't refresh your latest order updates. Your previously loaded orders are still shown.
                                <button type="button" onClick={fetchOrders} className="ml-2 font-semibold underline">
                                    Try again
                                </button>
                            </div>
                        )}

                        {filteredOrders.map((order) => {

                            const currentStep = getStatusStep(
                                order.status
                            );

                            return (
                                <div
                                    key={order._id}
                                    className="rounded-xl bg-white p-6 shadow-sm"
                                >

                                    {/* Order Header */}
                                    <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row">

                                        <div>

                                            <p className="text-sm text-gray-500">
                                                Order ID
                                            </p>

                                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                                <p className="break-all font-bold text-gray-900">
                                                    #{order._id}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => copyOrderId(order._id)}
                                                    className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                                >
                                                    {copiedOrderId === order._id ? "Copied!" : "Copy ID"}
                                                </button>
                                            </div>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {order.createdAt && !Number.isNaN(new Date(order.createdAt).getTime())
                                                    ? new Date(order.createdAt).toLocaleString()
                                                    : "Order date unavailable"}
                                            </p>

                                        </div>

                                        <div className="text-left sm:text-right">

                                            <span
                                                className={`inline-block rounded-full px-4 py-2 text-sm font-semibold ${getStatusColor(
                                                    order.status
                                                )}`}
                                            >
                                                {order.status}
                                            </span>
                                            {order.status === "Cancelled" && order.cancellationReason && (
                                                <p className="mt-2 text-sm text-red-600">Reason: {order.cancellationReason}</p>
                                            )}
                                            {order.status === "Out for Delivery" && order.deliveryDeadlineAt && (
                                                <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                                    Delivery deadline: {new Date(order.deliveryDeadlineAt).toLocaleString()}. This order must be delivered within 1 hour after dispatch, or it will be automatically cancelled.
                                                </p>
                                            )}
                                            {(order.status === "Pending" ||
                                                order.status === "Accepted") && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleCancelOrder(order._id)}
                                                    disabled={cancelingOrderId === order._id}
                                                    className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {cancelingOrderId === order._id ? "Cancelling..." : "Cancel Order"}
                                                </button>
                                            )}
                                            {order.status === "Delivered" && (
                                                <button
                                                    onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowReview(true);
                                                    }}
                                                    className="rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600"
                                                >
                                                    ⭐ Rate & Review
                                                </button>
                                                )}
                                            {order.status === "Delivered" &&
                                                (order.returnStatus === "Not Requested" ||
                                                    !order.returnStatus) && (
                                                    <button
                                                    onClick={() => {
                                                        setReturnOrderId(order._id);
                                                        setReturnReason("");
                                                    }}
                                                    className="mt-3 rounded bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
                                                    >
                                                    Request Return
                                                    </button>
                                                )}
                                            <p className="mt-2 text-lg font-bold text-gray-900">
                                                ₹{order.totalAmount}
                                            </p>
                                            <div className="mt-2 text-sm text-gray-500">
                                                <p>Payment: {order.paymentMethod === "Online" ? "Online Payment" : "Cash on Delivery"}</p>
                                                <p>Payment Status: {order.paymentStatus || "Pending"}</p>
                                            </div>

                                        </div>

                                    </div>

                                    {/* Restaurant */}
                                    <div className="mt-5">

                                        <p className="text-sm text-gray-500">
                                            Restaurant
                                        </p>

                                        <p className="mt-1 font-bold text-gray-900">
                                            {order.restaurantId?.restaurantName ||
                                                "Restaurant"}
                                        </p>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {order.restaurantId?.address}
                                        </p>

                                    </div>

                                    {/* Status Tracking */}
                                    {order.status !== "Cancelled" && (
                                        <div className="mt-8">

                                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                                <p className="font-semibold text-gray-800">Order Status</p>
                                                <span className="text-xs text-gray-500 sm:hidden">Swipe to view all steps</span>
                                            </div>

                                            <div className="overflow-x-auto pb-2">
                                                <div className="grid min-w-[520px] grid-cols-5">

                                                {[
                                                    "Pending",
                                                    "Accepted",
                                                    "Preparing",
                                                    "Out for Delivery",
                                                    "Delivered",
                                                ].map((status, index) => (

                                                    <div
                                                        key={status}
                                                        className="relative px-1 text-center"
                                                        aria-current={status === order.status ? "step" : undefined}
                                                    >

                                                        {/* Line */}
                                                        {index < 4 && (
                                                            <div
                                                                className={`absolute left-1/2 top-4 h-1 w-full ${
                                                                    index < currentStep
                                                                        ? "bg-green-500"
                                                                        : "bg-gray-200"
                                                                }`}
                                                            />
                                                        )}

                                                        {/* Circle */}
                                                        <div
                                                            className={`relative z-10 mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                                                index <= currentStep
                                                                    ? "bg-green-500 text-white"
                                                                    : "bg-gray-200 text-gray-500"
                                                            }`}
                                                        >
                                                            {index <= currentStep
                                                                ? "✓"
                                                                : index + 1}
                                                        </div>

                                                        <p
                                                            className={`mt-2 text-xs ${
                                                                index <= currentStep
                                                                    ? "font-semibold text-gray-800"
                                                                    : "text-gray-400"
                                                            }`}
                                                        >
                                                            {status}
                                                        </p>

                                                    </div>

                                                ))}
                                                </div>
                                            </div>

                                        </div>
                                    )}

                                    {/* Cancelled */}
                                    {order.status === "Cancelled" && (
                                        <div className="mt-6 rounded-lg bg-red-50 p-4">

                                            <p className="font-semibold text-red-700">
                                                This order has been cancelled.
                                            </p>

                                        </div>
                                    )}

                                    {/* Ordered Items */}
                                    <div className="mt-8 border-t border-gray-200 pt-5">

                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-semibold text-gray-800">
                                                Ordered Items
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {Array.isArray(order.items) ? order.items.length : 0} {Array.isArray(order.items) && order.items.length === 1 ? "item" : "items"}
                                            </p>
                                        </div>

                                        <div className="mt-3 space-y-3">

                                            {(Array.isArray(order.items) ? order.items : []).map((item, index) => (

                                                <div
                                                    key={item.productId || `${item.productName || "item"}-${index}`}
                                                    className="flex items-center justify-between"
                                                >

                                                    <div>

                                                        <p className="font-medium text-gray-800">
                                                            {item.productName}
                                                        </p>

                                                        <p className="text-sm text-gray-500">
                                                            ₹{item.price} ×{" "}
                                                            {item.quantity}
                                                        </p>

                                                    </div>

                                                    <p className="font-semibold text-gray-900">
                                                        ₹{item.subtotal}
                                                    </p>

                                                </div>

                                            ))}

                                        </div>

                                    </div>

                                    {/* Delivery Address */}
                                    <div className="mt-5 border-t border-gray-200 pt-5">

                                        <p className="text-sm text-gray-500">
                                            Delivery Address
                                        </p>

                                        <p className="mt-1 font-medium text-gray-800">
                                            {order.deliveryAddress}
                                        </p>

                                    </div>

                                    {/* Return Request Status */}
                                    {order.returnStatus &&
                                        order.returnStatus !== "Not Requested" && (
                                            <div className="mt-5 rounded-lg border border-orange-200 bg-orange-50 p-4">
                                                <p className="font-semibold text-orange-800">
                                                    Return Status: {order.returnStatus}
                                                </p>

                                                {order.returnReason && (
                                                    <p className="mt-2 text-sm text-gray-700">
                                                        <span className="font-medium">Reason:</span>{" "}
                                                        {order.returnReason}
                                                    </p>
                                                )}

                                                {order.returnAdminNote && (
                                                    <p className="mt-2 text-sm text-gray-700">
                                                        <span className="font-medium">Admin Note:</span>{" "}
                                                        {order.returnAdminNote}
                                                    </p>
                                                )}

                                                {order.returnRequestedAt && !Number.isNaN(new Date(order.returnRequestedAt).getTime()) && (
                                                    <p className="mt-2 text-xs text-gray-500">
                                                        Requested on:{" "}
                                                        {new Date(order.returnRequestedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                </div>
                            );
                        })}

                    </div>

                )}
                {showReview && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">
                        Rate Your Order
                        </h2>

                        <button
                        onClick={() => { if (!reviewSubmitting) { setShowReview(false); setReviewError(""); } }}
                        disabled={reviewSubmitting}
                        aria-label="Close review dialog"
                        className="text-xl text-gray-500 hover:text-gray-900 disabled:opacity-50"
                        >
                        ✕
                        </button>
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                        How was your experience?
                    </p>

                    {/* Stars */}
                    <div className="mt-5 flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => {
                                setRating(star);
                                if (reviewError) setReviewError("");
                            }}
                            disabled={reviewSubmitting}
                            aria-label={`Rate ${star} out of 5 stars`}
                            aria-pressed={rating === star}
                            className="text-3xl disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {star <= rating ? "⭐" : "☆"}
                        </button>
                        ))}
                    </div>

                    <p className="mt-2 text-sm font-medium text-gray-600">
                        {rating} out of 5
                    </p>

                    {/* Comment */}
                    <textarea
                        value={comment}
                        onChange={(e) => {
                            setComment(e.target.value);
                            if (reviewError) setReviewError("");
                        }}
                        maxLength={1000}
                        placeholder="Write your review..."
                        rows="4"
                        className="mt-5 w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-red-500"
                    />

                    <p className="mt-1 text-right text-xs text-gray-500">{comment.length}/1000 characters</p>
                    {reviewError && (
                        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{reviewError}</p>
                    )}

                    {/* Submit */}
                    <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={!comment.trim() || reviewSubmitting}
                        className="mt-4 w-full rounded-xl bg-red-500 py-3 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                    >
                        {reviewSubmitting ? "Submitting Review..." : "Submit Review"}
                    </button>

                    </div>
                </div>
                )}

                {returnOrderId && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <form
                        onSubmit={handleReturnRequest}
                        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
                        >
                        <h2 className="mb-4 text-xl font-semibold">
                            Request Order Return
                        </h2>

                        <label className="mb-2 block text-sm font-medium">
                            Reason for return
                        </label>

                        <textarea
                            value={returnReason}
                            onChange={(e) => { setReturnReason(e.target.value); if (returnError) setReturnError(""); }}
                            maxLength={500}
                            rows={4}
                            required
                            placeholder="Explain why you want to return this order..."
                            className="w-full rounded border p-3 outline-none focus:ring-2 focus:ring-orange-400"
                        />

                        <p className="mt-1 text-right text-xs text-gray-500">
                            {returnReason.length}/500 characters
                        </p>
                        {returnError && (
                            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{returnError}</p>
                        )}

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                            type="button"
                            onClick={() => {
                                setReturnOrderId(null);
                                setReturnReason("");
                                setReturnError("");
                            }}
                            disabled={returnLoading}
                            className="rounded border px-4 py-2"
                            >
                            Cancel
                            </button>

                            <button
                            type="submit"
                            disabled={returnLoading || !returnReason.trim()}
                            className="rounded bg-orange-500 px-4 py-2 text-white disabled:opacity-50"
                            >
                            {returnLoading ? "Submitting..." : "Submit Request"}
                            </button>
                        </div>
                        </form>
                    </div>
                    )}
            </main>

        </div>
    );
};

export default MyOrders;