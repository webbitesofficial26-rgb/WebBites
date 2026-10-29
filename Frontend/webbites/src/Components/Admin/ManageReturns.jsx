import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageReturns = () => {
    const [returnRequests, setReturnRequests] = useState([]);
    const [notes, setNotes] = useState({});
    const [loading, setLoading] = useState(true);
    const [processingOrderId, setProcessingOrderId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchReturnRequests = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await apiClient.get(
                    "/api/admin/returns",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status === 1) {
                    setReturnRequests(response.data.data || []);
                }
            } catch (error) {
                console.error("Return requests fetch error:", error);

                if (
                    error.response?.status === 401 ||
                    error.response?.status === 403
                ) {
                    alert("Please log in with an admin account.");
                    navigate("/admin/login");
                } else {
                    alert(
                        error.response?.data?.message ||
                        "Failed to load return requests."
                    );
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReturnRequests();
    }, [navigate]);

    const refreshReturnRequests = async () => {
        const token = localStorage.getItem("token");
        const response = await apiClient.get(
            "/api/admin/returns",
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (response.data.status === 1) {
            setReturnRequests(response.data.data || []);
        }
    };

    const handleReview = async (orderId, decision) => {
        const action = decision === "Approved" ? "approve" : "reject";

        if (
            !window.confirm(
                `Are you sure you want to ${action} this return request?`
            )
        ) {
            return;
        }

        try {
            setProcessingOrderId(orderId);
            const token = localStorage.getItem("token");

            const response = await apiClient.put(
                `/api/admin/orders/${orderId}/return`,
                {
                    decision,
                    returnAdminNote: notes[orderId] || "",
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                alert(`Return request ${action}d successfully.`);
                await refreshReturnRequests();
            } else {
                alert(
                    response.data.message ||
                    "Unable to review return request."
                );
            }
        } catch (error) {
            console.error("Review return error:", error);
            alert(
                error.response?.data?.message ||
                "Unable to review the return request."
            );
        } finally {
            setProcessingOrderId(null);
        }
    };

    const handleProcessRefund = async (order) => {
        if (order.paymentMethod === "COD") {
            alert(
                order.paymentStatus === "Paid"
                    ? "This COD order requires a manual refund. No online refund was initiated."
                    : "Payment is not recorded as paid. No online refund is required."
            );
            return;
        }

        if (order.paymentMethod !== "Online" || order.paymentStatus !== "Paid") {
            alert("Only paid online orders can be refunded automatically.");
            return;
        }

        if (
            order.refundId ||
            ["Processing", "Processed", "Manual Required"].includes(order.refundStatus)
        ) {
            alert(
                "A refund has already been initiated or requires reconciliation. Do not submit another refund."
            );
            return;
        }

        const confirmed = window.confirm(
            `Request a refund of ₹${Number(order.totalAmount || 0).toLocaleString("en-IN")} for order ${order._id}?`
        );

        if (!confirmed) return;

        try {
            setProcessingOrderId(order._id);
            const token = localStorage.getItem("token");

            const response = await apiClient.post(
                `/api/admin/orders/${order._id}/refund`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            alert(response.data.message || "Refund request submitted.");
            await refreshReturnRequests();
        } catch (error) {
            console.error("Process refund error:", error);
            alert(
                error.response?.data?.message ||
                "Refund request failed. Check Razorpay before trying again."
            );
            // Refresh to show the latest server-side refund status.
            try {
                await refreshReturnRequests();
            } catch (refreshError) {
                console.error("Could not refresh returns:", refreshError);
            }
        } finally {
            setProcessingOrderId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader />

            <div className="flex">
                <AdminSidebar />

                <main className="w-full min-w-0 p-6 md:p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Returns
                        </h1>
                        <p className="mt-2 text-gray-500">
                            Review return requests and track approved refunds.
                        </p>
                    </div>

                    {loading ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                            <p className="text-gray-500">Loading return requests...</p>
                        </div>
                    ) : returnRequests.length === 0 ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                            <div className="text-5xl">📦</div>
                            <h2 className="mt-4 text-xl font-bold text-gray-800">
                                No Return Requests
                            </h2>
                            <p className="mt-2 text-gray-500">
                                Pending and approved return requests will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {returnRequests.map((order) => {
                                const isPending = order.returnStatus === "Return Requested";
                                const isApproved = order.returnStatus === "Approved";
                                const isBusy = processingOrderId === order._id;

                                return (
                                    <section
                                        key={order._id}
                                        className="rounded-xl bg-white p-6 shadow-sm"
                                    >
                                        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-4 sm:flex-row">
                                            <div>
                                                <p className="text-sm text-gray-500">Order ID</p>
                                                <p className="mt-1 break-all font-semibold text-gray-900">
                                                    #{order._id}
                                                </p>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Requested:{" "}
                                                    {order.returnRequestedAt
                                                        ? new Date(order.returnRequestedAt).toLocaleString()
                                                        : "Date unavailable"}
                                                </p>
                                            </div>

                                            <div className="sm:text-right">
                                                <span
                                                    className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
                                                        isPending
                                                            ? "bg-orange-100 text-orange-700"
                                                            : "bg-green-100 text-green-700"
                                                    }`}
                                                >
                                                    {order.returnStatus}
                                                </span>
                                                <p className="mt-2 text-xl font-bold text-gray-900">
                                                    ₹{Number(order.totalAmount || 0).toLocaleString("en-IN")}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    Payment: {order.paymentMethod || "N/A"} ·{" "}
                                                    {order.paymentStatus || "N/A"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5 grid gap-5 md:grid-cols-2">
                                            <div>
                                                <h2 className="font-semibold text-gray-800">Customer</h2>
                                                <p className="mt-1 text-gray-700">
                                                    {order.customerId?.name ||
                                                        order.customerId?.fullName ||
                                                        "Customer"}
                                                </p>
                                                <p className="text-sm text-gray-500">
                                                    {order.customerId?.email || "Email unavailable"}
                                                </p>
                                            </div>
                                            <div>
                                                <h2 className="font-semibold text-gray-800">Restaurant</h2>
                                                <p className="mt-1 text-gray-700">
                                                    {order.restaurantId?.restaurantName || "Restaurant"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-5">
                                            <h2 className="font-semibold text-gray-800">Return Reason</h2>
                                            <p className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-gray-700">
                                                {order.returnReason || "No reason provided"}
                                            </p>
                                        </div>

                                        {order.returnAdminNote && (
                                            <div className="mt-4">
                                                <h2 className="font-semibold text-gray-800">Admin Note</h2>
                                                <p className="mt-2 rounded-lg bg-gray-50 p-3 text-gray-700">
                                                    {order.returnAdminNote}
                                                </p>
                                            </div>
                                        )}

                                        {isPending && (
                                            <div className="mt-5">
                                                <h2 className="mb-2 font-semibold text-gray-800">
                                                    Admin Note (optional)
                                                </h2>
                                                <textarea
                                                    value={notes[order._id] || ""}
                                                    onChange={(event) =>
                                                        setNotes((currentNotes) => ({
                                                            ...currentNotes,
                                                            [order._id]: event.target.value,
                                                        }))
                                                    }
                                                    maxLength={500}
                                                    rows={3}
                                                    placeholder="Add a note for the customer..."
                                                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-red-500"
                                                />
                                                <p className="mt-1 text-right text-xs text-gray-500">
                                                    {(notes[order._id] || "").length}/500 characters
                                                </p>
                                            </div>
                                        )}

                                        {isApproved && (
                                            <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                <p className="font-semibold text-blue-900">
                                                    Refund Status: {order.refundStatus || "Not Initiated"}
                                                </p>
                                                {order.refundId && (
                                                    <p className="mt-1 break-all text-sm text-gray-700">
                                                        Refund ID: {order.refundId}
                                                    </p>
                                                )}
                                                {order.refundAmount > 0 && (
                                                    <p className="mt-1 text-sm text-gray-700">
                                                        Refund Amount: ₹{order.refundAmount}
                                                    </p>
                                                )}
                                                {order.refundFailureReason && (
                                                    <p className="mt-1 text-sm text-red-700">
                                                        Note: {order.refundFailureReason}
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                        <div className="mt-5 flex flex-wrap gap-3">
                                            {isPending && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReview(order._id, "Approved")}
                                                        disabled={isBusy}
                                                        className="rounded-lg bg-green-600 px-5 py-2 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isBusy ? "Processing..." : "Approve Return"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReview(order._id, "Rejected")}
                                                        disabled={isBusy}
                                                        className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isBusy ? "Processing..." : "Reject Return"}
                                                    </button>
                                                </>
                                            )}

                                            {isApproved && order.paymentMethod === "COD" && (
                                                <p className="self-center text-sm font-medium text-amber-700">
                                                    COD: verify payment collection and handle any refund manually.
                                                </p>
                                            )}

                                            {isApproved &&
                                                order.paymentMethod === "Online" &&
                                                order.paymentStatus === "Paid" &&
                                                !order.refundId &&
                                                !["Processing", "Processed", "Manual Required"].includes(order.refundStatus) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleProcessRefund(order)}
                                                        disabled={isBusy}
                                                        className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {isBusy ? "Processing..." : "Process Refund"}
                                                    </button>
                                                )}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ManageReturns;
