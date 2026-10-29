import { useEffect, useMemo, useState } from "react";
import apiClient from "../../config/apiClient";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageCustomers = () => {

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pageError, setPageError] = useState("");
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const token = localStorage.getItem("token");


  // Fetch customers
  useEffect(() => {

    const fetchCustomers = async () => {

      try {

        const response = await apiClient.get(
          "/api/admin/customers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === 1) {
          setCustomers(response.data.data);
          setPageError("");
        } else {
          setPageError(response.data.message || "Failed to load customers.");
        }

      } catch (error) {

        console.error(error);
        setPageError(error.response?.data?.message || "Unable to load customers. Please check your connection and try again.");

      } finally {

        setLoading(false);

      }

    };

    fetchCustomers();

  }, [token, retryCount]);

  const filteredCustomers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.address]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [customers, searchTerm]);

  // View customer
  const handleView = (customer) => {

    setSelectedCustomer(customer);
    setShowView(true);

  };


  // Open edit modal
  const handleEdit = (customer) => {

    setSelectedCustomer({
      _id: customer._id,
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
    });

    setShowEdit(true);

  };


  // Input change
  const handleChange = (e) => {

    setFeedback({ type: "", message: "" });
    setSelectedCustomer({
      ...selectedCustomer,
      [e.target.name]: e.target.value,
    });

  };


  // Update customer
  const handleUpdate = async (e) => {

    e.preventDefault();

    setFeedback({ type: "", message: "" });
    setSaving(true);

    try {

      const response = await apiClient.put(
        `/api/admin/customers/${selectedCustomer._id}`,
        {
          name: selectedCustomer.name,
          email: selectedCustomer.email,
          phone: selectedCustomer.phone,
          address: selectedCustomer.address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 1) {

        const updatedCustomer = response.data.data || selectedCustomer;
        setFeedback({ type: "success", message: "Customer updated successfully." });

        setCustomers((currentCustomers) =>
          currentCustomers.map((customer) =>
            customer._id === selectedCustomer._id
              ? { ...customer, ...updatedCustomer }
              : customer
          )
        );

        setShowEdit(false);
        setSelectedCustomer(null);

      } else {
        setFeedback({ type: "error", message: response.data.message || "Failed to update customer." });
      }

    } catch (error) {

      console.error(error);
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to update customer. Please try again.",
      });

    } finally {
      setSaving(false);
    }

  };


  // Delete customer
  const handleDelete = async (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmDelete) {
      return;
    }

    setFeedback({ type: "", message: "" });
    setDeletingId(id);

    try {

      const response = await apiClient.delete(
        `/api/admin/customers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 1) {

        setFeedback({ type: "success", message: "Customer deleted successfully." });

        setCustomers((currentCustomers) =>
          currentCustomers.filter((customer) => customer._id !== id)
        );

      } else {
        setFeedback({ type: "error", message: response.data.message || "Failed to delete customer." });
      }

    } catch (error) {

      console.error(error);
      setFeedback({
        type: "error",
        message: error.response?.data?.message || "Failed to delete customer. Please try again.",
      });

    } finally {
      setDeletingId(null);
    }

  };


  return (
    <div className="min-h-screen bg-gray-100">

      {/* Admin Header */}
      <AdminHeader />

      {/* Sidebar + Content */}
      <div className="flex">

        {/* Admin Sidebar */}
        <AdminSidebar />

        {/* Main Content */}
        <main className="w-full p-6 md:p-8">

          {/* Heading */}
          <div className="mb-8">

            <h1 className="text-3xl font-bold text-gray-900">
              Manage Customers
            </h1>

            <p className="mt-2 text-gray-500">
              View and manage all registered customers.
            </p>

          </div>

          {feedback.message && (
            <div
              role="status"
              className={`mb-5 rounded-lg border px-4 py-3 text-sm ${feedback.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}
            >
              {feedback.message}
            </div>
          )}

          <div className="mb-5 rounded-xl bg-white p-4 shadow-sm">
            <label htmlFor="customer-search" className="mb-2 block text-sm font-medium text-gray-700">
              Search customers
            </label>
            <input
              id="customer-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by name, email, phone, or address..."
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
            <p className="mt-2 text-sm text-gray-500">
              Showing {filteredCustomers.length} of {customers.length} customers
            </p>
          </div>

          {/* Loading */}
          {loading ? (

            <div className="rounded-xl bg-white p-10 text-center shadow-sm">

              <p className="text-gray-500">
                Loading customers...
              </p>

            </div>

          ) : pageError ? (
            <div className="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
              <p className="mb-4 text-red-700">{pageError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setRetryCount((count) => count + 1);
                }}
                className="rounded-lg bg-orange-500 px-5 py-2 text-white hover:bg-orange-600"
              >
                Retry
              </button>
            </div>
          ) : (

            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">

              <table className="w-full text-left">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                      Name
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                      Email
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                      Phone
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                      Address
                    </th>

                    <th className="px-5 py-4 text-sm font-semibold text-gray-700">
                      Actions
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredCustomers.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="px-5 py-10 text-center text-gray-500"
                      >
                        {customers.length === 0 ? "No customers have registered yet." : "No customers match your search."}
                      </td>

                    </tr>

                  ) : (

                    filteredCustomers.map((customer) => (

                      <tr
                        key={customer._id}
                        className="border-t hover:bg-gray-50"
                      >

                        {/* Name */}
                        <td className="px-5 py-4">

                          <p className="font-semibold text-gray-800">
                            {customer.name}
                          </p>

                        </td>


                        {/* Email */}
                        <td className="px-5 py-4 text-gray-700">
                          {customer.email}
                        </td>


                        {/* Phone */}
                        <td className="px-5 py-4 text-gray-700">
                          {customer.phone || "Not available"}
                        </td>


                        {/* Address */}
                        <td className="max-w-xs px-5 py-4 text-gray-700">
                          {customer.address || "Not available"}
                        </td>


                        {/* Actions */}
                        <td className="px-5 py-4">

                          <div className="flex gap-2">

                            <button
                              onClick={() =>
                                handleView(customer)
                              }
                              className="rounded-lg bg-gray-500 px-3 py-2 text-sm text-white hover:bg-gray-600"
                            >
                              View
                            </button>


                            <button
                              onClick={() =>
                                handleEdit(customer)
                              }
                              className="rounded-lg bg-blue-500 px-3 py-2 text-sm text-white hover:bg-blue-600"
                            >
                              Edit
                            </button>


                            <button
                              onClick={() => handleDelete(customer._id)}
                              disabled={deletingId === customer._id}
                              className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingId === customer._id ? "Deleting..." : "Delete"}
                            </button>

                          </div>

                        </td>

                      </tr>

                    ))

                  )}

                </tbody>

              </table>

            </div>

          )}


          {/* View Customer Modal */}
          {showView && selectedCustomer && (

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

              <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">

                <div className="mb-6 flex items-center justify-between">

                  <h2 className="text-2xl font-bold text-gray-900">
                    Customer Details
                  </h2>

                  <button
                    onClick={() => {
                      setShowView(false);
                      setSelectedCustomer(null);
                    }}
                    className="text-xl text-gray-500 hover:text-gray-800"
                  >
                    ✕
                  </button>

                </div>


                <div className="space-y-4">

                  <div>
                    <p className="text-sm text-gray-500">
                      Name
                    </p>

                    <p className="font-semibold">
                      {selectedCustomer.name}
                    </p>
                  </div>


                  <div>
                    <p className="text-sm text-gray-500">
                      Email
                    </p>

                    <p className="font-semibold">
                      {selectedCustomer.email}
                    </p>
                  </div>


                  <div>
                    <p className="text-sm text-gray-500">
                      Phone
                    </p>

                    <p className="font-semibold">
                      {selectedCustomer.phone || "Not available"}
                    </p>
                  </div>


                  <div>
                    <p className="text-sm text-gray-500">
                      Address
                    </p>

                    <p className="font-semibold">
                      {selectedCustomer.address || "Not available"}
                    </p>
                  </div>

                </div>


                <button
                  onClick={() => {
                    setShowView(false);
                    setSelectedCustomer(null);
                  }}
                  className="mt-6 w-full rounded-lg bg-gray-800 px-5 py-2 text-white hover:bg-gray-900"
                >
                  Close
                </button>

              </div>

            </div>

          )}


          {/* Edit Customer Modal */}
          {showEdit && selectedCustomer && (

            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

              <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">

                {/* Header */}
                <div className="mb-5 flex items-center justify-between">

                  <h2 className="text-2xl font-bold text-gray-900">
                    Edit Customer
                  </h2>

                  <button
                    onClick={() => {
                      setShowEdit(false);
                      setSelectedCustomer(null);
                    }}
                    className="text-xl text-gray-500 hover:text-gray-800"
                  >
                    ✕
                  </button>

                </div>


                {/* Form */}
                <form
                  onSubmit={handleUpdate}
                  className="space-y-4"
                >

                  {feedback.type === "error" && feedback.message && (
                    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {feedback.message}
                    </p>
                  )}

                  <input
                    type="text"
                    name="name"
                    value={selectedCustomer.name}
                    onChange={handleChange}
                    placeholder="Customer Name"
                    className="w-full rounded-lg border px-4 py-3"
                    required
                  />


                  <input
                    type="email"
                    name="email"
                    value={selectedCustomer.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="w-full rounded-lg border px-4 py-3"
                    required
                  />


                  <input
                    type="tel"
                    name="phone"
                    value={selectedCustomer.phone}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    title="Enter exactly 10 digits"
                    className="w-full rounded-lg border px-4 py-3"
                    required
                  />


                  <textarea
                    name="address"
                    value={selectedCustomer.address}
                    onChange={handleChange}
                    placeholder="Address"
                    rows="3"
                    className="w-full rounded-lg border px-4 py-3"
                    required
                  />


                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-3">

                    <button
                      type="button"
                      onClick={() => {
                        setShowEdit(false);
                        setSelectedCustomer(null);
                      }}
                      className="rounded-lg bg-gray-200 px-5 py-2 hover:bg-gray-300"
                    >
                      Cancel
                    </button>


                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-orange-500 px-5 py-2 text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>

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

export default ManageCustomers;