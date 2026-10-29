import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageDelivery = () => {
  const navigate = useNavigate();
  const [deliveryPartners, setDeliveryPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [busyAction, setBusyAction] = useState("");
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  const fetchDeliveryPartners = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.get("/api/admin/delivery", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 1) {
        setDeliveryPartners(response.data.data || []);
      } else {
        setLoadError(response.data.message || "Unable to load delivery partners.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login");
        return;
      }
      setLoadError(error.response?.data?.message || "Failed to load delivery partners. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryPartners();
    // Fetch function is intentionally kept in the effect's dependency scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const filteredPartners = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return deliveryPartners;
    return deliveryPartners.filter((partner) =>
      [partner.deliveryName, partner.email, partner.phone, partner.address]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [deliveryPartners, searchTerm]);

  const showMessage = (type, message) => setFeedback({ type, message });

  const handleView = (partner) => {
    setSelectedPartner(partner);
    setShowView(true);
  };

  const handleEdit = (partner) => {
    setSelectedPartner({
      _id: partner._id,
      deliveryName: partner.deliveryName || "",
      email: partner.email || "",
      phone: partner.phone || "",
      address: partner.address || "",
      isActive: partner.isActive,
    });
    setFeedback({ type: "", message: "" });
    setShowEdit(true);
  };

  const handleChange = (event) => {
    setSelectedPartner((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const phone = String(selectedPartner.phone || "").replace(/\D/g, "");
    if (phone.length !== 10) {
      showMessage("error", "Enter a valid 10-digit phone number.");
      return;
    }
    setBusyAction(`edit-${selectedPartner._id}`);
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put(
        `/api/admin/delivery/${selectedPartner._id}`,
        {
          deliveryName: selectedPartner.deliveryName.trim(),
          email: selectedPartner.email.trim(),
          phone,
          address: selectedPartner.address.trim(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 1) {
        setDeliveryPartners((partners) => partners.map((partner) =>
          partner._id === selectedPartner._id ? { ...partner, ...selectedPartner, phone } : partner
        ));
        setShowEdit(false);
        setSelectedPartner(null);
        showMessage("success", "Delivery partner updated successfully.");
      } else {
        showMessage("error", response.data.message || "Failed to update delivery partner.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login");
        return;
      }
      showMessage("error", error.response?.data?.message || "Failed to update delivery partner.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDelete = async (partner) => {
    if (!window.confirm(`Are you sure you want to delete ${partner.deliveryName || "this delivery partner"}?`)) return;
    setBusyAction(`delete-${partner._id}`);
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.delete(`/api/admin/delivery/${partner._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 1) {
        setDeliveryPartners((partners) => partners.filter((item) => item._id !== partner._id));
        showMessage("success", "Delivery partner deleted successfully.");
      } else {
        showMessage("error", response.data.message || "Failed to delete delivery partner.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login");
        return;
      }
      showMessage("error", error.response?.data?.message || "Failed to delete delivery partner.");
    } finally {
      setBusyAction("");
    }
  };

  const handleStatus = async (partner) => {
    const newStatus = !partner.isActive;
    const action = newStatus ? "approve and activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${action} ${partner.deliveryName}?`)) return;
    setBusyAction(`status-${partner._id}`);
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put(
        `/api/admin/delivery/${partner._id}/status`,
        { isActive: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status === 1) {
        setDeliveryPartners((partners) => partners.map((item) => item._id === partner._id
          ? { ...item, isActive: response.data.data.isActive }
          : item
        ));
        showMessage("success", newStatus ? "Delivery partner approved and activated." : "Delivery partner deactivated.");
      } else {
        showMessage("error", response.data.message || "Failed to update delivery status.");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/admin/login");
        return;
      }
      showMessage("error", error.response?.data?.message || "Failed to update delivery status.");
    } finally {
      setBusyAction("");
    }
  };

  const closeModal = () => {
    setShowView(false);
    setShowEdit(false);
    setSelectedPartner(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <AdminHeader />
      <div className="flex">
        <AdminSidebar />
        <main className="w-full p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Manage Delivery Partners</h1>
            <p className="mt-2 text-gray-500">View and manage all registered WebBites delivery partners.</p>
          </div>

          {feedback.message && (
            <div role="status" className={`mb-5 rounded-lg border px-4 py-3 ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
              <div className="flex items-center justify-between gap-3">
                <span>{feedback.message}</span>
                <button type="button" onClick={() => setFeedback({ type: "", message: "" })} className="font-semibold" aria-label="Dismiss message">×</button>
              </div>
            </div>
          )}

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500">Total Delivery Partners</p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">{deliveryPartners.length}</h2>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm">
              <label htmlFor="delivery-search" className="mb-2 block text-sm font-medium text-gray-700">Search delivery partners</label>
              <input id="delivery-search" type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Name, email, phone or address" className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100" />
              <p className="mt-2 text-xs text-gray-500">Showing {filteredPartners.length} of {deliveryPartners.length} partners</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-white shadow-sm">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading delivery partners...</div>
            ) : loadError ? (
              <div className="p-10 text-center">
                <p className="mb-4 text-red-600">{loadError}</p>
                <button type="button" onClick={fetchDeliveryPartners} className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600">Retry</button>
              </div>
            ) : filteredPartners.length === 0 ? (
              <div className="p-10 text-center text-gray-500">{deliveryPartners.length ? "No delivery partners match your search." : "No delivery partners found."}</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50"><tr>
                    { ["Name", "Email", "Phone", "Address", "Status", "Actions"].map((heading) => <th key={heading} className="px-6 py-4 text-left text-sm font-semibold text-gray-700">{heading}</th>) }
                  </tr></thead>
                  <tbody>
                    {filteredPartners.map((partner) => {
                      const rowBusy = busyAction.endsWith(partner._id);
                      return (
                        <tr key={partner._id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{partner.deliveryName || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-600">{partner.email || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-600">{partner.phone || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-600">{partner.address || "N/A"}</td>
                          <td className="px-6 py-4">
                            <button type="button" disabled={rowBusy} onClick={() => handleStatus(partner)} className={`min-w-24 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${partner.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                              {busyAction === `status-${partner._id}` ? "Updating..." : partner.isActive ? "Deactivate" : "Approve"}
                            </button>
                          </td>
                          <td className="px-6 py-4"><div className="flex flex-wrap gap-2">
                            <button type="button" disabled={rowBusy} onClick={() => handleView(partner)} className="rounded-lg bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-600 disabled:opacity-60">View</button>
                            <button type="button" disabled={rowBusy} onClick={() => handleEdit(partner)} className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600 disabled:opacity-60">Edit</button>
                            <button type="button" disabled={rowBusy} onClick={() => handleDelete(partner)} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:opacity-60">{busyAction === `delete-${partner._id}` ? "Deleting..." : "Delete"}</button>
                          </div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {showView && selectedPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div role="dialog" aria-modal="true" aria-labelledby="delivery-view-title" className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-6 flex items-center justify-between"><h2 id="delivery-view-title" className="text-2xl font-bold text-gray-900">Delivery Partner Details</h2><button type="button" onClick={closeModal} className="text-xl text-gray-500 hover:text-gray-800" aria-label="Close details">×</button></div>
                <div className="space-y-4">
                  {[ ["Name", selectedPartner.deliveryName], ["Email", selectedPartner.email], ["Phone", selectedPartner.phone], ["Address", selectedPartner.address], ["Status", selectedPartner.isActive ? "Active" : "Inactive"] ].map(([label, value]) => <div key={label}><p className="text-sm text-gray-500">{label}</p><p className="font-semibold">{value || "N/A"}</p></div>)}
                </div>
                <button type="button" onClick={closeModal} className="mt-6 w-full rounded-lg bg-gray-800 px-5 py-2 text-white hover:bg-gray-900">Close</button>
              </div>
            </div>
          )}

          {showEdit && selectedPartner && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div role="dialog" aria-modal="true" aria-labelledby="delivery-edit-title" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
                <div className="mb-5 flex items-center justify-between"><h2 id="delivery-edit-title" className="text-2xl font-bold text-gray-900">Edit Delivery Partner</h2><button type="button" onClick={closeModal} className="text-xl text-gray-500 hover:text-gray-800" aria-label="Close edit form">×</button></div>
                <form onSubmit={handleUpdate} className="space-y-4">
                  <input type="text" name="deliveryName" value={selectedPartner.deliveryName} onChange={handleChange} placeholder="Delivery Name" aria-label="Delivery name" className="w-full rounded-lg border px-4 py-3" required />
                  <input type="email" name="email" value={selectedPartner.email} onChange={handleChange} placeholder="Email" aria-label="Email" className="w-full rounded-lg border px-4 py-3" required />
                  <input type="tel" name="phone" value={selectedPartner.phone} onChange={handleChange} placeholder="10-digit phone number" aria-label="Phone number" pattern="[0-9]{10}" maxLength={10} className="w-full rounded-lg border px-4 py-3" required />
                  <textarea name="address" value={selectedPartner.address} onChange={handleChange} placeholder="Address" aria-label="Address" rows="3" className="w-full rounded-lg border px-4 py-3" required />
                  <div className="flex justify-end gap-3 pt-3">
                    <button type="button" onClick={closeModal} disabled={busyAction === `edit-${selectedPartner._id}`} className="rounded-lg bg-gray-200 px-5 py-2 hover:bg-gray-300 disabled:opacity-60">Cancel</button>
                    <button type="submit" disabled={busyAction === `edit-${selectedPartner._id}`} className="rounded-lg bg-orange-500 px-5 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{busyAction === `edit-${selectedPartner._id}` ? "Saving..." : "Save Changes"}</button>
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

export default ManageDelivery;
