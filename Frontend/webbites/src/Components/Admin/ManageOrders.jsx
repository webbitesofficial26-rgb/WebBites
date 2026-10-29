import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageOrders = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [loadError, setLoadError] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const [statusMessage, setStatusMessage] = useState(null);

    // Fetch all orders
    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setLoadError("");

            try {
                const token = localStorage.getItem("token");

                const response = await apiClient.get(
                    "/api/admin/orders",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                if (response.data.status === 1) {
                    setOrders(Array.isArray(response.data.data) ? response.data.data : []);
                } else {
                    setLoadError(response.data.message || "Unable to load orders.");
                }
            } catch (error) {
                console.error("Failed to fetch orders:", error);

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/admin/login");
                    return;
                }

                setLoadError(
                    error.response?.data?.message ||
                    "Couldn't load orders. Check your connection and try again."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [navigate, retryCount]);

    // Status badge colors
    const getStatusClass = (status) => {
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

    // Only permit valid next steps
    const getNextStatuses = (status) => {
        const transitions = {
            Pending: ["Accepted"],
            Accepted: ["Preparing"],
            Preparing: ["Out for Delivery"],
            "Out for Delivery": [],
            Delivered: [],
            Cancelled: []
        };

        return transitions[status] || [];
    };

    // Update order status
    const handleStatusChange = async (orderId, newStatus) => {
        if (!newStatus) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to change this order to "${newStatus}"?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setUpdatingOrder(orderId);
            setStatusMessage(null);

            const token = localStorage.getItem("token");

            const response = await apiClient.put(
                `/api/admin/orders/${orderId}/status`,
                {
                    status: newStatus
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.status === 1) {
                // Update the order shown on the page
                setOrders((previousOrders) =>
                    previousOrders.map((order) =>
                        order._id === orderId
                            ? {
                                ...order,
                                status: response.data.data.status
                            }
                            : order
                    )
                );

                setStatusMessage({
                    type: "success",
                    text: response.data.message || "Order status updated successfully."
                });
            } else {
                setStatusMessage({
                    type: "error",
                    text: response.data.message || "Failed to update order status."
                });
            }
        } catch (error) {
            console.error("Failed to update order:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/admin/login");
                return;
            }

            setStatusMessage({
                type: "error",
                text: error.response?.data?.message || "Failed to update order status."
            });
        } finally {
            setUpdatingOrder(null);
        }
    };

    // Search and filter orders
    const filteredOrders = orders.filter((order) => {
        const searchText = search.toLowerCase().trim();

        const searchableFields = [
            order._id,
            order.customerId?.name,
            order.customerId?.email,
            order.restaurantId?.restaurantName,
            order.deliveryId?.deliveryName,
            order.status
        ];

        const matchesSearch = searchableFields.some((field) =>
            String(field || "").toLowerCase().includes(searchText)
        );

        const matchesStatus =
            statusFilter === "All" ||
            order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // Statistics
    const pendingOrders = orders.filter(
        (order) => order.status === "Pending"
    ).length;

    const deliveredOrders = orders.filter(
        (order) => order.status === "Delivered"
    ).length;

    const cancelledOrders = orders.filter(
        (order) => order.status === "Cancelled"
    ).length;

    return (
        <div className="min-h-screen bg-gray-100">

            <AdminHeader />

            <div className="flex">

                <AdminSidebar />

                <main className="w-full min-w-0 p-6 md:p-8">

                    {/* Page Heading */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Orders
                        </h1>

                        <p className="mt-2 text-gray-500">
                            View and monitor all WebBites orders.
                        </p>
                    </div>

                    {/* Statistics */}
                    <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                        <div className="rounded-xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Total Orders
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-gray-900">
                                {orders.length}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Pending Orders
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-yellow-600">
                                {pendingOrders}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Delivered Orders
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-green-600">
                                {deliveredOrders}
                            </h2>
                        </div>

                        <div className="rounded-xl bg-white p-5 shadow-sm">
                            <p className="text-sm text-gray-500">
                                Cancelled Orders
                            </p>

                            <h2 className="mt-2 text-3xl font-bold text-red-600">
                                {cancelledOrders}
                            </h2>
                        </div>

                    </div>

                    {/* Search and Filter */}
                    <div className="mb-3 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row">

                        <input
                            type="text"
                            placeholder="Search order ID, customer, restaurant..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <select
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(event.target.value)
                            }
                            className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Preparing">Preparing</option>
                            <option value="Out for Delivery">
                                Out for Delivery
                            </option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>

                    </div>

                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-gray-600" aria-live="polite">
                            Showing <span className="font-semibold">{loading ? "—" : filteredOrders.length}</span> of <span className="font-semibold">{orders.length}</span> orders
                        </p>
                        {statusMessage && (
                            <p
                                role="status"
                                className={`rounded-lg px-4 py-2 text-sm ${statusMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                            >
                                {statusMessage.text}
                            </p>
                        )}
                    </div>

                    {/* Orders */}
                    <div className="space-y-5">

                        {loading ? (
                            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                                <p className="text-gray-500">
                                    Loading orders...
                                </p>
                            </div>
                        ) : loadError ? (
                            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                                <p className="text-red-600">{loadError}</p>
                                <button
                                    type="button"
                                    onClick={() => setRetryCount((count) => count + 1)}
                                    className="mt-4 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                                <p className="text-gray-500">
                                    {orders.length === 0 ? "No orders are available yet." : "No orders match your search or filter."}
                                </p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div
                                    key={order._id}
                                    className="rounded-xl bg-white p-6 shadow-sm"
                                >

                                    {/* Order Header */}
                                    <div className="flex flex-col justify-between gap-4 border-b pb-5 md:flex-row md:items-center">

                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Order #
                                                {order._id
                                                    .slice(-6)
                                                    .toUpperCase()}
                                            </h2>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {new Date(
                                                    order.createdAt
                                                ).toLocaleString()}
                                            </p>
                                        </div>

                                        <span
                                            className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
                                                order.status
                                            )}`}
                                        >
                                            {order.status}
                                        </span>

                                    </div>

                                    {/* Customer, Restaurant and Delivery */}
                                    <div className="mt-5 grid gap-5 md:grid-cols-3">

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Customer
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {order.customerId?.name ||
                                                    "Unknown"}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {order.customerId?.email ||
                                                    "N/A"}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Restaurant
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {order.restaurantId
                                                    ?.restaurantName ||
                                                    "Unknown"}
                                            </p>

                                            <p className="text-sm text-gray-500">
                                                {order.restaurantId?.address ||
                                                    ""}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Delivery Partner
                                            </p>

                                            <p className="mt-1 font-semibold text-gray-900">
                                                {order.deliveryId
                                                    ?.deliveryName ||
                                                    "Not Assigned"}
                                            </p>

                                            {order.deliveryId?._id && (
                                                <p className="break-all text-xs text-gray-500">
                                                    ID: {order.deliveryId._id}
                                                </p>
                                            )}
                                        </div>

                                    </div>

                                    {/* Ordered Items */}
                                    <div className="mt-6">

                                        <h3 className="mb-3 font-semibold text-gray-900">
                                            Order Items
                                        </h3>

                                        <div className="overflow-x-auto">
                                            <table className="w-full">

                                                <thead className="border-b bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                            Product
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                            Price
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                            Quantity
                                                        </th>

                                                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                                                            Subtotal
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {order.items?.map(
                                                        (item, index) => (
                                                            <tr
                                                                key={
                                                                    item._id ||
                                                                    index
                                                                }
                                                                className="border-b"
                                                            >
                                                                <td className="px-4 py-3 text-gray-800">
                                                                    {item.productName}
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-600">
                                                                    ₹{item.price}
                                                                </td>

                                                                <td className="px-4 py-3 text-gray-600">
                                                                    {item.quantity}
                                                                </td>

                                                                <td className="px-4 py-3 font-medium text-gray-800">
                                                                    ₹{item.subtotal}
                                                                </td>
                                                            </tr>
                                                        )
                                                    )}
                                                </tbody>

                                            </table>
                                        </div>

                                    </div>

                                    {/* Address and Total */}
                                    <div className="mt-6 flex flex-col gap-4 border-t pt-5 md:flex-row md:items-center md:justify-between">

                                        <div>
                                            <p className="text-sm text-gray-500">
                                                Delivery Address
                                            </p>

                                            <p className="mt-1 text-gray-700">
                                                {order.deliveryAddress}
                                            </p>
                                        </div>

                                        <div className="md:text-right">
                                            <p className="text-sm text-gray-500">
                                                Total Amount
                                            </p>

                                            <p className="mt-1 text-2xl font-bold text-gray-900">
                                                ₹{order.totalAmount}
                                            </p>
                                        </div>

                                    </div>

                                    {/* Admin Status Controls */}
                                    <div className="mt-6 flex flex-col gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">

                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Order Management
                                            </p>

                                            <p className="mt-1 text-sm text-gray-500">
                                                {order.status === "Out for Delivery"
                                                    ? "The assigned delivery partner must complete this order."
                                                    : order.status === "Delivered"
                                                    ? "This order has been delivered."
                                                    : order.status === "Cancelled"
                                                    ? "This order has been cancelled."
                                                    : "Update the order to its next valid status."}
                                            </p>
                                        </div>

                                        {getNextStatuses(order.status).length > 0 ||
                                        ["Pending", "Accepted", "Preparing"].includes(
                                            order.status
                                        ) ? (
                                            <div className="flex flex-wrap gap-3">

                                                <select
                                                    value=""
                                                    disabled={
                                                        updatingOrder ===
                                                        order._id
                                                    }
                                                    onChange={(event) =>
                                                        handleStatusChange(
                                                            order._id,
                                                            event.target.value
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 disabled:opacity-50"
                                                >
                                                    <option value="" disabled>
                                                        {updatingOrder ===
                                                        order._id
                                                            ? "Updating..."
                                                            : "Update Status"}
                                                    </option>

                                                    {getNextStatuses(
                                                        order.status
                                                    ).map((status) => (
                                                        <option
                                                            key={status}
                                                            value={status}
                                                        >
                                                            {status}
                                                        </option>
                                                    ))}

                                                    {[
                                                        "Pending",
                                                        "Accepted",
                                                        "Preparing"
                                                    ].includes(order.status) && (
                                                        <option value="Cancelled">
                                                            Cancelled
                                                        </option>
                                                    )}
                                                </select>

                                            </div>
                                        ) : null}

                                    </div>

                                </div>
                            ))
                        )}

                    </div>

                </main>

            </div>

        </div>
    );
};

export default ManageOrders;