import { useEffect, useMemo, useState } from "react";
import apiClient from "../../config/apiClient";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/api/admin/restaurants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status === 1) {
          setRestaurants(response.data.data || []);
          setPageError("");
        } else {
          setPageError(response.data.message || "Failed to load restaurants.");
        }
      } catch (error) {
        console.error(error);
        setPageError(error.response?.data?.message || "Unable to load restaurants. Please check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [token, retryCount]);

  const filteredRestaurants = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return restaurants;
    return restaurants.filter((restaurant) =>
      [restaurant.restaurantName, restaurant.ownerName, restaurant.email, restaurant.phone, restaurant.address]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [restaurants, searchTerm]);

  const handleEdit = (restaurant) => {
    setFeedback({ type: "", message: "" });
    setSelectedRestaurant({
      _id: restaurant._id,
      restaurantName: restaurant.restaurantName || "",
      ownerName: restaurant.ownerName || "",
      email: restaurant.email || "",
      phone: restaurant.phone || "",
      address: restaurant.address || "",
    });
    setShowEdit(true);
  };

  const closeEdit = () => {
    if (saving) return;
    setShowEdit(false);
    setSelectedRestaurant(null);
  };

  const handleChange = (e) => {
    setFeedback({ type: "", message: "" });
    setSelectedRestaurant((current) => ({ ...current, [e.target.name]: e.target.value }));
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setFeedback({ type: "", message: "" });
    const phoneDigits = selectedRestaurant.phone.replace(/\D/g, "");
    if (phoneDigits.length !== 10) {
      setFeedback({ type: "error", message: "Enter a valid 10-digit phone number." });
      return;
    }
    setSaving(true);
    try {
      const response = await apiClient.put(
        `/api/admin/restaurants/${selectedRestaurant._id}`,
        {
          restaurantName: selectedRestaurant.restaurantName.trim(),
          ownerName: selectedRestaurant.ownerName.trim(),
          email: selectedRestaurant.email.trim(),
          phone: selectedRestaurant.phone.trim(),
          address: selectedRestaurant.address.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 1) {
        const updatedRestaurant = response.data.data || selectedRestaurant;
        setRestaurants((current) => current.map((restaurant) =>
          restaurant._id === selectedRestaurant._id ? { ...restaurant, ...updatedRestaurant } : restaurant
        ));
        setFeedback({ type: "success", message: "Restaurant updated successfully." });
        setShowEdit(false);
        setSelectedRestaurant(null);
      } else {
        setFeedback({ type: "error", message: response.data.message || "Failed to update restaurant." });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to update restaurant. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this restaurant?")) return;
    setFeedback({ type: "", message: "" });
    setDeletingId(id);
    try {
      const response = await apiClient.delete(`/api/admin/restaurants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 1) {
        setRestaurants((current) => current.filter((restaurant) => restaurant._id !== id));
        setFeedback({ type: "success", message: "Restaurant deleted successfully." });
      } else {
        setFeedback({ type: "error", message: response.data.message || "Failed to delete restaurant." });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to delete restaurant. Please try again." });
    } finally {
      setDeletingId(null);
    }
  };

  const handleApproval = async (restaurant) => {
    const isApproved = restaurant.isApproved === false;
    const action = isApproved ? "approve" : "revoke approval for";
    if (!window.confirm(`Are you sure you want to ${action} ${restaurant.restaurantName}?`)) return;
    setFeedback({ type: "", message: "" });
    setStatusUpdatingId(restaurant._id);
    try {
      const response = await apiClient.put(`/api/admin/restaurants/${restaurant._id}/approval`, { isApproved }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 1) {
        setRestaurants((current) => current.map((item) => item._id === restaurant._id
          ? { ...item, isApproved: response.data.data.isApproved, isOpen: response.data.data.isOpen }
          : item
        ));
        setFeedback({ type: "success", message: response.data.message || "Restaurant approval updated." });
      } else {
        setFeedback({ type: "error", message: response.data.message || "Failed to update restaurant approval." });
      }
    } catch (error) {
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to update restaurant approval." });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleStatus = async (restaurant) => {
    setFeedback({ type: "", message: "" });
    setStatusUpdatingId(restaurant._id);
    try {
      const response = await apiClient.put(`/api/admin/restaurants/${restaurant._id}/status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 1) {
        setRestaurants((current) => current.map((item) => item._id === restaurant._id
          ? { ...item, isOpen: response.data.data.isOpen }
          : item
        ));
        setFeedback({ type: "success", message: `${restaurant.restaurantName} status updated.` });
      } else {
        setFeedback({ type: "error", message: response.data.message || "Failed to update restaurant status." });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: error.response?.data?.message || "Failed to update restaurant status. Please try again." });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="w-full p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Restaurants</h1>
            <p className="mt-2 text-gray-500">View and manage all registered restaurants.</p>
          </div>

          {feedback.message && (
            <div role="status" className={`mb-5 rounded-lg border px-4 py-3 text-sm ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
              {feedback.message}
            </div>
          )}

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, owner, email, phone or address..."
              aria-label="Search restaurants"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 sm:max-w-xl focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
            <p className="text-sm text-gray-600" aria-live="polite">
              Showing {filteredRestaurants.length} of {restaurants.length} restaurants
            </p>
          </div>

          {loading ? (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm"><p className="text-gray-500">Loading restaurants...</p></div>
          ) : pageError ? (
            <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
              <p className="text-red-700">{pageError}</p>
              <button onClick={() => setRetryCount((count) => count + 1)} className="mt-4 rounded-lg bg-orange-500 px-5 py-2 text-white hover:bg-orange-600">Try Again</button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Restaurant</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Owner</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Phone</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Approval</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Open Status</th>
                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.length === 0 ? (
                    <tr><td colSpan="7" className="px-5 py-10 text-center text-gray-500">{restaurants.length === 0 ? "No restaurants found." : "No restaurants match your search."}</td></tr>
                  ) : filteredRestaurants.map((restaurant) => (
                    <tr key={restaurant._id} className="border-t hover:bg-gray-50">
                      <td className="px-5 py-4"><p className="font-semibold text-gray-800">{restaurant.restaurantName}</p><p className="text-sm text-gray-500">{restaurant.address}</p></td>
                      <td className="px-5 py-4 text-gray-700">{restaurant.ownerName}</td>
                      <td className="px-5 py-4 text-gray-700">{restaurant.email}</td>
                      <td className="px-5 py-4 text-gray-700">{restaurant.phone}</td>
                      <td className="px-5 py-4">
                        <button disabled={statusUpdatingId === restaurant._id || saving || Boolean(deletingId)} onClick={() => handleApproval(restaurant)} className={`rounded-full px-3 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${restaurant.isApproved === false ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>
                          {statusUpdatingId === restaurant._id ? "Updating..." : restaurant.isApproved === false ? "Approve" : "Revoke approval"}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <button disabled={statusUpdatingId === restaurant._id || saving || Boolean(deletingId) || restaurant.isApproved === false} onClick={() => handleStatus(restaurant)} className={`rounded-full px-3 py-1 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${restaurant.isOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {statusUpdatingId === restaurant._id ? "Updating..." : restaurant.isApproved === false ? "Pending approval" : restaurant.isOpen ? "Open" : "Closed"}
                        </button>
                      </td>
                      <td className="px-5 py-4"><div className="flex gap-2">
                        <button onClick={() => handleEdit(restaurant)} disabled={Boolean(deletingId || statusUpdatingId)} className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-50">Edit</button>
                        <button onClick={() => handleDelete(restaurant._id)} disabled={deletingId === restaurant._id || saving || statusUpdatingId === restaurant._id} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-50">{deletingId === restaurant._id ? "Deleting..." : "Delete"}</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {showEdit && selectedRestaurant && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Restaurant</h2>
                  <button type="button" onClick={closeEdit} disabled={saving} aria-label="Close edit restaurant form" className="text-xl text-gray-500 hover:text-gray-800 disabled:opacity-50">✕</button>
                </div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <input type="text" name="restaurantName" value={selectedRestaurant.restaurantName} onChange={handleChange} placeholder="Restaurant Name" aria-label="Restaurant name" className="w-full rounded-lg border px-4 py-3" required />
                  <input type="text" name="ownerName" value={selectedRestaurant.ownerName} onChange={handleChange} placeholder="Owner Name" aria-label="Owner name" className="w-full rounded-lg border px-4 py-3" required />
                  <input type="email" name="email" value={selectedRestaurant.email} onChange={handleChange} placeholder="Email" aria-label="Email" className="w-full rounded-lg border px-4 py-3" required />
                  <input type="tel" name="phone" value={selectedRestaurant.phone} onChange={handleChange} placeholder="10-digit phone number" aria-label="Phone number" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" title="Enter a valid 10-digit phone number" className="w-full rounded-lg border px-4 py-3" required />
                  <textarea name="address" value={selectedRestaurant.address} onChange={handleChange} placeholder="Address" aria-label="Address" rows="3" className="w-full rounded-lg border px-4 py-3" required />
                  <div className="flex justify-end gap-3 pt-3">
                    <button type="button" onClick={closeEdit} disabled={saving} className="rounded-lg bg-gray-200 px-5 py-2 hover:bg-gray-300 disabled:opacity-50">Cancel</button>
                    <button type="submit" disabled={saving} className="rounded-lg bg-orange-500 px-5 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ManageRestaurants;
