
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import AdminGeminiChat from "./AdminGeminiChat";

const PIE_COLORS = [
    "#EAB308",
    "#3B82F6",
    "#F97316",
    "#8B5CF6",
    "#22C55E",
    "#EF4444",
    "#64748B",
];

const Admin = () => {
    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
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
    });

    const [analytics, setAnalytics] = useState({
        revenueChart: [],
        orderStatusChart: [],
    });

    const [loading, setLoading] = useState(true);
    const [dashboardError, setDashboardError] = useState("");
    const [dashboardRetry, setDashboardRetry] = useState(0);
    const [analyticsLoading, setAnalyticsLoading] = useState(true);
    const [analyticsError, setAnalyticsError] = useState("");
    const [analyticsRetry, setAnalyticsRetry] = useState(0);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await apiClient.get(
                    "/api/admin/dashboard",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status === 1 && response.data.data) {
                    setDashboard((current) => ({ ...current, ...response.data.data }));
                    setDashboardError("");
                } else {
                    setDashboardError("Unable to load dashboard information.");
                }
            } catch (error) {
                console.error("Dashboard fetch error:", error);
                setDashboardError("Unable to load dashboard information. Please try again.");

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/admin/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate, dashboardRetry]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await apiClient.get(
                    "/api/admin/analytics",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status === 1) {
                    setAnalytics({
                        revenueChart:
                            response.data.data.revenueChart || [],
                        orderStatusChart:
                            response.data.data.orderStatusChart || [],
                    });
                } else {
                    setAnalyticsError("Unable to load analytics.");
                }
            } catch (error) {
                console.error("Analytics fetch error:", error);
                setAnalyticsError("Unable to load analytics. Please try again.");

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/admin/login");
                }
            } finally {
                setAnalyticsLoading(false);
            }
        };

        fetchAnalytics();
    }, [navigate, analyticsRetry]);

    const formatCurrency = (amount) =>
        `₹${Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const statCards = [
        {
            title: "Total Customers",
            value: dashboard.totalCustomers,
            color: "text-blue-600",
        },
        {
            title: "Restaurants",
            value: dashboard.totalRestaurants,
            color: "text-purple-600",
        },
        {
            title: "Delivery Partners",
            value: dashboard.totalDeliveryPartners,
            color: "text-indigo-600",
        },
        {
            title: "Total Orders",
            value: dashboard.totalOrders,
            color: "text-gray-900",
        },
        {
            title: "Pending Orders",
            value: dashboard.pendingOrders,
            color: "text-yellow-600",
        },
        {
            title: "Completed Orders",
            value: dashboard.completedOrders,
            color: "text-green-600",
        },
        {
            title: "Cancelled Orders",
            value: dashboard.cancelledOrders,
            color: "text-red-600",
        },
        {
            title: "Today's Orders",
            value: dashboard.todayOrders,
            color: "text-orange-600",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader />

            <div className="flex">
                <AdminSidebar />

                <main className="w-full min-w-0 p-6 md:p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Admin Dashboard
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Monitor WebBites platform performance and sales.
                        </p>
                    </div>

                    {loading ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm" role="status">
                            <p className="text-gray-500">Loading dashboard...</p>
                        </div>
                    ) : dashboardError ? (
                        <div className="rounded-xl bg-white p-8 text-center shadow-sm" role="alert">
                            <p className="text-red-600">{dashboardError}</p>
                            <button
                                type="button"
                                onClick={() => {
                                    setLoading(true);
                                    setDashboardRetry((attempt) => attempt + 1);
                                }}
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                            >
                                Try Again
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Revenue Overview */}
                            <h2 className="mb-4 text-xl font-bold text-gray-900">
                                Revenue Overview
                            </h2>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Total Revenue
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-green-600">
                                        {formatCurrency(dashboard.totalRevenue)}
                                    </h2>

                                    <p className="mt-2 text-sm text-gray-500">
                                        From delivered, non-refunded orders
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Today's Revenue
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-blue-600">
                                        {formatCurrency(dashboard.todayRevenue)}
                                    </h2>

                                    <p className="mt-2 text-sm text-gray-500">
                                        Delivered orders created today
                                    </p>
                                </div>
                            </div>

                            {/* Analytics Charts */}
                            <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">
                                Sales & Order Analytics
                            </h2>

                            {analyticsLoading ? (
                                <div className="rounded-xl bg-white p-8 text-center shadow-sm">
                                    Loading analytics...
                                </div>
                            ) : analyticsError ? (
                                <div className="rounded-xl bg-white p-8 text-center shadow-sm" role="alert">
                                    <p className="text-red-600">{analyticsError}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAnalyticsLoading(true);
                                            setAnalyticsError("");
                                            setAnalyticsRetry((attempt) => attempt + 1);
                                        }}
                                        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
                                    >
                                        Retry Analytics
                                    </button>
                                </div>
                            ) : (
                                <div className="grid min-w-0 gap-5 xl:grid-cols-2">
                                    {/* Monthly Revenue Chart */}
                                    <div className="min-w-0 rounded-xl bg-white p-6 shadow-sm">
                                        <h3 className="mb-5 text-lg font-semibold text-gray-900">
                                            Monthly Revenue
                                        </h3>

                                        {analytics.revenueChart.length === 0 ? (
                                            <p className="py-12 text-center text-gray-500">
                                                No revenue data available.
                                            </p>
                                        ) : (
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <LineChart
                                                        data={analytics.revenueChart}
                                                        margin={{
                                                            top: 10,
                                                            right: 20,
                                                            left: 10,
                                                            bottom: 10,
                                                        }}
                                                    >
                                                        <CartesianGrid
                                                            strokeDasharray="3 3"
                                                        />

                                                        <XAxis
                                                            dataKey="month"
                                                            tick={{ fontSize: 12 }}
                                                        />

                                                        <YAxis
                                                            tickFormatter={(value) =>
                                                                `₹${value.toLocaleString("en-IN")}`
                                                            }
                                                            tick={{ fontSize: 12 }}
                                                            width={90}
                                                        />

                                                        <Tooltip
                                                            formatter={(value) => [
                                                                formatCurrency(value),
                                                                "Revenue",
                                                            ]}
                                                        />

                                                        <Legend />

                                                        <Line
                                                            type="monotone"
                                                            dataKey="revenue"
                                                            name="Revenue"
                                                            stroke="#16A34A"
                                                            strokeWidth={3}
                                                            dot={{ r: 4 }}
                                                            activeDot={{ r: 7 }}
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>

                                    {/* Order Status Chart */}
                                    <div className="min-w-0 rounded-xl bg-white p-6 shadow-sm">
                                        <h3 className="mb-5 text-lg font-semibold text-gray-900">
                                            Order Status Distribution
                                        </h3>

                                        {analytics.orderStatusChart.length === 0 ? (
                                            <p className="py-12 text-center text-gray-500">
                                                No order data available.
                                            </p>
                                        ) : (
                                            <div className="h-80 w-full">
                                                <ResponsiveContainer
                                                    width="100%"
                                                    height="100%"
                                                >
                                                    <PieChart>
                                                        <Pie
                                                            data={analytics.orderStatusChart}
                                                            dataKey="count"
                                                            nameKey="status"
                                                            cx="50%"
                                                            cy="45%"
                                                            outerRadius={100}
                                                            label={({ status, percent }) =>
                                                                `${status} (${(
                                                                    percent * 100
                                                                ).toFixed(0)}%)`
                                                            }
                                                        >
                                                            {analytics.orderStatusChart.map(
                                                                (entry, index) => (
                                                                    <Cell
                                                                        key={entry.status}
                                                                        fill={
                                                                            PIE_COLORS[
                                                                                index %
                                                                                    PIE_COLORS.length
                                                                            ]
                                                                        }
                                                                    />
                                                                )
                                                            )}
                                                        </Pie>

                                                        <Tooltip
                                                            formatter={(value) => [
                                                                value,
                                                                "Orders",
                                                            ]}
                                                        />

                                                        <Legend />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Platform Statistics */}
                            <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">
                                Platform Statistics
                            </h2>

                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {statCards.map((card) => (
                                    <div
                                        key={card.title}
                                        className="rounded-xl bg-white p-6 shadow-sm"
                                    >
                                        <p className="text-sm text-gray-500">
                                            {card.title}
                                        </p>

                                        <h2
                                            className={`mt-2 text-3xl font-bold ${card.color}`}
                                        >
                                            {Number(
                                                card.value || 0
                                            ).toLocaleString("en-IN")}
                                        </h2>
                                    </div>
                                ))}
                            </div>

                            {/* Payment Statistics */}
                            <h2 className="mb-4 mt-8 text-xl font-bold text-gray-900">
                                Payment Statistics
                            </h2>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Cash on Delivery Orders
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-orange-600">
                                        {dashboard.codOrders}
                                    </h2>
                                </div>

                                <div className="rounded-xl bg-white p-6 shadow-sm">
                                    <p className="text-sm text-gray-500">
                                        Online Payment Orders
                                    </p>

                                    <h2 className="mt-2 text-3xl font-bold text-blue-600">
                                        {dashboard.onlineOrders}
                                    </h2>
                                </div>
                            </div>

                            {/* Platform Overview */}
                            <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Platform Overview
                                </h2>

                                <div className="mt-6 grid gap-5 md:grid-cols-3">
                                    <div className="rounded-lg bg-gray-50 p-5">
                                        <p className="text-sm text-gray-500">
                                            Customers
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-gray-900">
                                            {dashboard.totalCustomers}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-5">
                                        <p className="text-sm text-gray-500">
                                            Restaurants
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-gray-900">
                                            {dashboard.totalRestaurants}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-5">
                                        <p className="text-sm text-gray-500">
                                            Delivery Partners
                                        </p>

                                        <p className="mt-2 text-2xl font-bold text-gray-900">
                                            {dashboard.totalDeliveryPartners}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
            <AdminGeminiChat />
        </div>
    );
};

export default Admin;

