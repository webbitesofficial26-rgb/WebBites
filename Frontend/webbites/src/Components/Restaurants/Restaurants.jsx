import { Link, useNavigate } from "react-router-dom";
import RestaurantSidebar from "./RestaurantSidebar";
import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import RestaurantGeminiChat from "./RestaurantGeminiChat";

const Restaurants = () => {
  const navigate = useNavigate();

  const [restaurantInfo, setRestaurantInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const fetchRestaurantInfo = async () => {
    setIsLoading(true);
    setLoadError("");

    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.get("/api/restaurant/info", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 1 && response.data.data?.restaurant) {
        setRestaurantInfo(response.data.data);
      } else {
        setLoadError(response.data.message || "Unable to load restaurant dashboard.");
      }
    } catch (error) {
      console.error("Could not load restaurant dashboard:", error);
      setLoadError(
        error.response?.data?.message ||
          "Could not load the dashboard. Check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantInfo();
    // The dashboard should load once when this page opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  const handleToggleStatus = async () => {
    if (isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    setStatusMessage("");

    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put(
        "/api/restaurant/status",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status === 1) {
        setRestaurantInfo((prev) => ({
          ...prev,
          restaurant: {
            ...prev.restaurant,
            isOpen: response.data.data.isOpen,
          },
        }));
        setStatusMessage(response.data.message || "Restaurant status updated.");
      } else {
        setStatusMessage(response.data.message || "Could not update restaurant status.");
      }
    } catch (error) {
      console.error("Could not update restaurant status:", error);
      setStatusMessage(
        error.response?.data?.message || "Could not update status. Please try again."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading restaurant dashboard...</p>
      </div>
    );
  }

  if (loadError || !restaurantInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 px-6 text-center">
        <p className="text-red-600" role="alert">
          {loadError || "Restaurant dashboard information is unavailable."}
        </p>
        <button
          type="button"
          onClick={fetchRestaurantInfo}
          className="rounded-lg bg-red-500 px-5 py-2 font-semibold text-white hover:bg-red-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { restaurant, stats = {} } = restaurantInfo;
  const recentOrders = Array.isArray(restaurantInfo.recentOrders)
    ? restaurantInfo.recentOrders
    : [];

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

          <span className="text-sm text-gray-600">
            Restaurant Panel
          </span>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
          >
            Logout
          </button>

        </div>

      </header>


      <div className="flex">

        {/* Sidebar */}

        <RestaurantSidebar />


        {/* Main Content */}

        <main className="w-full p-6 md:p-8">

          {/* Dashboard Heading */}

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Restaurant Dashboard
            </h1>

            <p className="mt-2 text-gray-500">
              Manage your restaurant, orders and earnings.
            </p>
          </div>


          {/* Stats */}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Today's Orders
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {stats.todaysOrders ?? 0}
              </h2>
            </div>


            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Pending Orders
              </p>

              <h2 className="mt-2 text-3xl font-bold text-yellow-500">
                {stats.pendingOrders ?? 0}
              </h2>
            </div>


            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Completed Orders
              </p>

              <h2 className="mt-2 text-3xl font-bold text-green-600">
                {stats.completedOrders ?? 0}
              </h2>
            </div>


            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">
                Total Earnings
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                ₹{stats.totalEarnings ?? 0}
              </h2>
            </div>

          </div>


          {/* Restaurant Information */}

          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Restaurant Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your restaurant details.
              </p>
            </div>


            <div className="mt-6 grid gap-6 sm:grid-cols-3">

              {/* Restaurant Name */}

              <div>
                <p className="text-sm text-gray-500">
                  Restaurant
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {restaurant.restaurantName}
                </p>
              </div>


              {/* Location */}

              <div>
                <p className="text-sm text-gray-500">
                  Location
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {restaurant.address}
                </p>
              </div>


              {/* Status */}

              <div>
                <p className="text-sm text-gray-500">
                  Status
                </p>

                <div className="mt-2 flex items-center gap-3">

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      restaurant.isOpen
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </span>


                  <button
                    type="button"
                    onClick={handleToggleStatus}
                    disabled={isUpdatingStatus}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                      restaurant.isOpen
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {isUpdatingStatus
                      ? "Updating..."
                      : restaurant.isOpen
                      ? "Close Restaurant"
                      : "Open Restaurant"}
                  </button>

                </div>
                {statusMessage && (
                  <p className={`mt-2 text-sm ${statusMessage.toLowerCase().includes("could not") || statusMessage.toLowerCase().includes("failed") ? "text-red-600" : "text-gray-600"}`} role="status">
                    {statusMessage}
                  </p>
                )}

              </div>

            </div>

          </div>


          {/* Recent Orders */}

          <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">

            <div className="flex items-center justify-between">

              <h2 className="text-xl font-bold text-gray-900">
                Recent Orders
              </h2>

              <Link
                to="/restaurant/orders"
                className="text-sm font-medium text-red-500 hover:text-red-600"
              >
                View All
              </Link>

            </div>


            <div className="mt-6 overflow-x-auto">

              {recentOrders.length === 0 ? (

                <p className="py-8 text-center text-gray-500">
                  No orders yet.
                </p>

              ) : (

                <table className="w-full text-left text-sm">

                  <thead className="border-b border-gray-200 text-gray-500">
                    <tr>
                      <th className="px-4 py-3">
                        Order
                      </th>

                      <th className="px-4 py-3">
                        Customer
                      </th>

                      <th className="px-4 py-3">
                        Items
                      </th>

                      <th className="px-4 py-3">
                        Amount
                      </th>

                      <th className="px-4 py-3">
                        Status
                      </th>
                    </tr>
                  </thead>


                  <tbody>

                    {recentOrders.map((order) => (

                      <tr
                        key={order._id}
                        className="border-b border-gray-100"
                      >

                        <td className="px-4 py-4 font-medium">
                          #{order._id.slice(-6).toUpperCase()}
                        </td>


                        <td className="px-4 py-4">
                          {order.customerName}
                        </td>


                        <td className="px-4 py-4">
                          {order.itemsCount}{" "}
                          {order.itemsCount === 1
                            ? "Item"
                            : "Items"}
                        </td>


                        <td className="px-4 py-4">
                          ₹{order.totalAmount}
                        </td>


                        <td className="px-4 py-4">

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${
                              order.status === "Delivered"
                                ? "bg-green-100 text-green-600"
                                : order.status === "Cancelled"
                                ? "bg-red-100 text-red-600"
                                : order.status ===
                                  "Out for Delivery"
                                ? "bg-blue-100 text-blue-600"
                                : order.status ===
                                  "Preparing"
                                ? "bg-orange-100 text-orange-600"
                                : order.status ===
                                  "Accepted"
                                ? "bg-green-50 text-green-600"
                                : "bg-yellow-100 text-yellow-600"
                            }`}
                          >
                            {order.status}
                          </span>

                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              )}

            </div>

          </div>

        </main>

      </div>

      <RestaurantGeminiChat />
    </div>
  );
};

export default Restaurants;