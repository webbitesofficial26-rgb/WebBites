import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const initialSummary = {
    totalCustomers: 0,
    totalRestaurants: 0,
    totalDeliveryPartners: 0,
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    todayOrders: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    codOrders: 0,
    onlineOrders: 0,
};

const formatCurrency = (amount) =>
    `₹${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const escapeCsv = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
};

const AdminReports = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(initialSummary);
    const [revenueRows, setRevenueRows] = useState([]);
    const [statusRows, setStatusRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [retry, setRetry] = useState(0);

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError("");

            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };
                const [dashboardResponse, analyticsResponse] = await Promise.all([
                    apiClient.get("/api/admin/dashboard", { headers }),
                    apiClient.get("/api/admin/analytics", { headers }),
                ]);

                if (dashboardResponse.data.status !== 1 || !dashboardResponse.data.data) {
                    throw new Error("Unable to load report summary.");
                }
                if (analyticsResponse.data.status !== 1 || !analyticsResponse.data.data) {
                    throw new Error("Unable to load report analytics.");
                }

                setSummary({ ...initialSummary, ...dashboardResponse.data.data });
                setRevenueRows(analyticsResponse.data.data.revenueChart || []);
                setStatusRows(analyticsResponse.data.data.orderStatusChart || []);
            } catch (requestError) {
                console.error("Admin reports fetch error:", requestError);
                setError(requestError.message || "Unable to load reports. Please try again.");

                if (requestError.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/admin/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [navigate, retry]);

    const downloadCsv = () => {
        const rows = [
            ["WebBites Admin Performance Report"],
            ["Generated At", new Date().toLocaleString("en-IN")],
            [],
            ["Platform Summary", "Value"],
            ["Total Customers", summary.totalCustomers],
            ["Total Restaurants", summary.totalRestaurants],
            ["Delivery Partners", summary.totalDeliveryPartners],
            ["Total Orders", summary.totalOrders],
            ["Today's Orders", summary.todayOrders],
            ["Pending Orders", summary.pendingOrders],
            ["Completed Orders", summary.completedOrders],
            ["Cancelled Orders", summary.cancelledOrders],
            ["Total Revenue (INR)", Number(summary.totalRevenue || 0).toFixed(2)],
            ["Today's Revenue (INR)", Number(summary.todayRevenue || 0).toFixed(2)],
            ["Cash on Delivery Orders", summary.codOrders],
            ["Online Payment Orders", summary.onlineOrders],
            [],
            ["Monthly Revenue", "Revenue (INR)"],
            ...revenueRows.map((row) => [row.month, Number(row.revenue || 0).toFixed(2)]),
            [],
            ["Order Status", "Order Count"],
            ...statusRows.map((row) => [row.status, row.count]),
        ];

        const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
        const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `webbites-admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const completionRate = Number(summary.totalOrders) > 0
        ? Math.round((Number(summary.completedOrders || 0) / Number(summary.totalOrders)) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader />
            <div className="flex">
                <AdminSidebar />
                <main className="w-full min-w-0 p-5 md:p-8">
                    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Reports & Performance</h1>
                            <p className="mt-2 text-gray-500">Review platform activity, order outcomes, and revenue trends.</p>
                        </div>
                        <button
                            type="button"
                            onClick={downloadCsv}
                            disabled={loading || Boolean(error)}
                            className="rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Export CSV Report
                        </button>
                    </div>

                    {loading ? (
                        <div className="rounded-xl bg-white p-10 text-center text-gray-500 shadow-sm" role="status">
                            Loading reports...
                        </div>
                    ) : error ? (
                        <div className="rounded-xl bg-white p-8 text-center shadow-sm" role="alert">
                            <p className="text-red-600">{error}</p>
                            <button
                                type="button"
                                onClick={() => setRetry((attempt) => attempt + 1)}
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                            >
                                Retry Reports
                            </button>
                        </div>
                    ) : (
                        <>
                            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Performance summary">
                                {[
                                    { label: "Total Orders", value: Number(summary.totalOrders || 0).toLocaleString("en-IN") },
                                    { label: "Completed Orders", value: Number(summary.completedOrders || 0).toLocaleString("en-IN") },
                                    { label: "Completion Rate", value: `${completionRate}%` },
                                    { label: "Total Revenue", value: formatCurrency(summary.totalRevenue) },
                                ].map((card) => (
                                    <article key={card.label} className="rounded-xl bg-white p-5 shadow-sm">
                                        <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                        <p className="mt-2 break-words text-2xl font-bold text-gray-900">{card.value}</p>
                                    </article>
                                ))}
                            </section>

                            <section className="mt-7 grid gap-6 xl:grid-cols-2">
                                <div className="rounded-xl bg-white p-5 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900">Monthly Revenue</h2>
                                    <p className="mb-4 mt-1 text-sm text-gray-500">Delivered, non-refunded orders for the last six months.</p>
                                    {revenueRows.length === 0 ? (
                                        <p className="py-6 text-sm text-gray-500">No revenue data available.</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[280px] text-left text-sm">
                                                <thead className="border-b text-xs uppercase text-gray-500">
                                                    <tr><th className="py-3 pr-4">Month</th><th className="py-3 text-right">Revenue</th></tr>
                                                </thead>
                                                <tbody>
                                                    {revenueRows.map((row) => (
                                                        <tr key={row.month} className="border-b last:border-0">
                                                            <td className="py-3 pr-4 font-medium text-gray-700">{row.month}</td>
                                                            <td className="py-3 text-right font-semibold text-gray-900">{formatCurrency(row.revenue)}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                <div className="rounded-xl bg-white p-5 shadow-sm">
                                    <h2 className="text-lg font-bold text-gray-900">Order Status Summary</h2>
                                    <p className="mb-4 mt-1 text-sm text-gray-500">Current order counts grouped by status.</p>
                                    {statusRows.length === 0 ? (
                                        <p className="py-6 text-sm text-gray-500">No order status data available.</p>
                                    ) : (
                                        <div className="space-y-4">
                                            {statusRows.map((row) => {
                                                const count = Number(row.count || 0);
                                                const total = statusRows.reduce((sum, item) => sum + Number(item.count || 0), 0);
                                                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                                                return (
                                                    <div key={row.status}>
                                                        <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                                                            <span className="font-medium text-gray-700">{row.status}</span>
                                                            <span className="text-gray-500">{count.toLocaleString("en-IN")} ({percent}%)</span>
                                                        </div>
                                                        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                                            <div className="h-full rounded-full bg-red-500" style={{ width: `${percent}%` }} />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="mt-7 rounded-xl bg-white p-5 shadow-sm">
                                <h2 className="text-lg font-bold text-gray-900">Platform Overview</h2>
                                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {[
                                        ["Customers", summary.totalCustomers],
                                        ["Restaurants", summary.totalRestaurants],
                                        ["Delivery Partners", summary.totalDeliveryPartners],
                                        ["Today's Orders", summary.todayOrders],
                                        ["Pending Orders", summary.pendingOrders],
                                        ["Cancelled Orders", summary.cancelledOrders],
                                        ["Today's Revenue", formatCurrency(summary.todayRevenue)],
                                        ["Cash on Delivery", summary.codOrders],
                                        ["Online Payments", summary.onlineOrders],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-lg border border-gray-100 p-4">
                                            <p className="text-sm text-gray-500">{label}</p>
                                            <p className="mt-1 text-xl font-semibold text-gray-900">{typeof value === "number" ? value.toLocaleString("en-IN") : value}</p>
                                        </div>
                                    ))}
                                </div>
                                <p className="mt-5 text-xs text-gray-400">Report figures are based on the existing Admin Dashboard and Analytics APIs.</p>
                            </section>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminReports;
