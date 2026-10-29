
import {  useCallback, useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import { useNavigate } from "react-router-dom";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageCoupons = () => {
    const navigate = useNavigate();

    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        minOrderAmount: "0",
        maxDiscount: "",
        expiryDate: "",
        usageLimit: "",
    });

   const fetchCoupons = useCallback(async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await apiClient.get(
                "/api/admin/coupons",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                setCoupons(response.data.data);
            }
        } catch (error) {
            console.error("Fetch coupons error:", error);

            if (error.response?.status === 401) {
                navigate("/admin/login");
            } else {
                setError(
                    error.response?.data?.message ||
                    "Unable to load coupons."
                );
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchCoupons();
    }, [fetchCoupons]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.code.trim() || !form.expiryDate) {
            setError("Please enter a coupon code and expiry date.");
            return;
        }

        const discountValue = Number(form.discountValue);
        const minOrderAmount = Number(form.minOrderAmount);

        if (
            !Number.isFinite(discountValue) ||
            discountValue <= 0 ||
            !Number.isFinite(minOrderAmount) ||
            minOrderAmount < 0
        ) {
            setError("Please enter valid discount and minimum order amounts.");
            return;
        }

        if (
            form.discountType === "percentage" &&
            discountValue > 100
        ) {
            setError("Percentage discount cannot exceed 100%.");
            return;
        }

        const payload = {
            code: form.code.trim().toUpperCase(),
            description: form.description.trim(),
            discountType: form.discountType,
            discountValue,
            minOrderAmount,
            maxDiscount:
                form.maxDiscount.trim() === ""
                    ? null
                    : Number(form.maxDiscount),
            expiryDate: new Date(form.expiryDate).toISOString(),
            usageLimit:
                form.usageLimit.trim() === ""
                    ? null
                    : Number(form.usageLimit),
        };

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            const response = await apiClient.post(
                "/api/admin/coupons",
                payload,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                alert("Coupon created successfully!");

                setForm({
                    code: "",
                    description: "",
                    discountType: "percentage",
                    discountValue: "",
                    minOrderAmount: "0",
                    maxDiscount: "",
                    expiryDate: "",
                    usageLimit: "",
                });

                await fetchCoupons();
            }
        } catch (error) {
            console.error("Create coupon error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to create coupon."
            );
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (couponId) => {
        try {
            const token = localStorage.getItem("token");

            const response = await apiClient.patch(
                `/api/admin/coupons/${couponId}/toggle`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                await fetchCoupons();
            }
        } catch (error) {
            console.error("Toggle coupon error:", error);

            alert(
                error.response?.data?.message ||
                "Unable to update coupon status."
            );
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
                            Manage Coupons
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Create and manage WebBites discount coupons.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <form
                        onSubmit={handleCreateCoupon}
                        className="rounded-xl bg-white p-6 shadow-sm"
                    >
                        <h2 className="text-xl font-bold text-gray-900">
                            Create New Coupon
                        </h2>

                        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Coupon Code
                                </label>

                                <input
                                    name="code"
                                    value={form.code}
                                    onChange={handleChange}
                                    placeholder="WEBBITES20"
                                    maxLength={30}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 uppercase outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Description
                                </label>

                                <input
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="20% off your order"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Discount Type
                                </label>

                                <select
                                    name="discountType"
                                    value={form.discountType}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                >
                                    <option value="percentage">
                                        Percentage (%)
                                    </option>
                                    <option value="fixed">
                                        Fixed Amount (₹)
                                    </option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Discount Value
                                </label>

                                <input
                                    type="number"
                                    name="discountValue"
                                    value={form.discountValue}
                                    onChange={handleChange}
                                    min="1"
                                    max={
                                        form.discountType === "percentage"
                                            ? "100"
                                            : undefined
                                    }
                                    step="0.01"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Minimum Order Amount (₹)
                                </label>

                                <input
                                    type="number"
                                    name="minOrderAmount"
                                    value={form.minOrderAmount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Maximum Discount (₹)
                                </label>

                                <input
                                    type="number"
                                    name="maxDiscount"
                                    value={form.maxDiscount}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    placeholder="Optional"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Expiry Date
                                </label>

                                <input
                                    type="date"
                                    name="expiryDate"
                                    value={form.expiryDate}
                                    onChange={handleChange}
                                    min={new Date().toLocaleDateString("en-CA")}
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Usage Limit
                                </label>

                                <input
                                    type="number"
                                    name="usageLimit"
                                    value={form.usageLimit}
                                    onChange={handleChange}
                                    min="1"
                                    step="1"
                                    placeholder="Unlimited"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="mt-6 rounded-lg bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                        >
                            {saving ? "Creating..." : "Create Coupon"}
                        </button>
                    </form>

                    <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">
                            Existing Coupons
                        </h2>

                        {loading ? (
                            <p className="mt-5 text-gray-500">
                                Loading coupons...
                            </p>
                        ) : coupons.length === 0 ? (
                            <p className="mt-5 text-gray-500">
                                No coupons created yet.
                            </p>
                        ) : (
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-sm">
                                    <thead>
                                        <tr className="border-b bg-gray-50 text-gray-600">
                                            <th className="p-3">Code</th>
                                            <th className="p-3">Discount</th>
                                            <th className="p-3">Minimum Order</th>
                                            <th className="p-3">Expiry</th>
                                            <th className="p-3">Usage</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Action</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {coupons.map((coupon) => (
                                            <tr
                                                key={coupon._id}
                                                className="border-b last:border-0"
                                            >
                                                <td className="p-3 font-semibold">
                                                    {coupon.code}
                                                </td>

                                                <td className="p-3">
                                                    {coupon.discountType === "percentage"
                                                        ? `${coupon.discountValue}%`
                                                        : `₹${coupon.discountValue}`}
                                                </td>

                                                <td className="p-3">
                                                    ₹{coupon.minOrderAmount}
                                                </td>

                                                <td className="p-3">
                                                    {new Date(
                                                        coupon.expiryDate
                                                    ).toLocaleDateString()}
                                                </td>

                                                <td className="p-3">
                                                    {coupon.usedCount} / {coupon.usageLimit ?? "∞"}
                                                </td>

                                                <td className="p-3">
                                                    <span
                                                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                            coupon.isActive
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-gray-200 text-gray-600"
                                                        }`}
                                                    >
                                                        {coupon.isActive
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                coupon._id
                                                            )
                                                        }
                                                        className={`rounded-lg px-3 py-2 font-medium text-white ${
                                                            coupon.isActive
                                                                ? "bg-gray-600 hover:bg-gray-700"
                                                                : "bg-green-600 hover:bg-green-700"
                                                        }`}
                                                    >
                                                        {coupon.isActive
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </main>
            </div>
        </div>
    );
};

export default ManageCoupons;

