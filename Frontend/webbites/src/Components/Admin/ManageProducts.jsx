import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import { useNavigate } from "react-router-dom";

import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const ManageProducts = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [availabilityFilter, setAvailabilityFilter] = useState("All");
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    const [loadingError, setLoadingError] = useState("");
    const [notice, setNotice] = useState("");
    const [reloadCount, setReloadCount] = useState(0);
    const [deletingProductId, setDeletingProductId] = useState(null);
    const [availabilityUpdatingId, setAvailabilityUpdatingId] = useState(null);

    // Fetch products when the page opens or the user retries.
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setLoadingError("");

            try {
                const token = localStorage.getItem("token");
                const response = await apiClient.get("/api/admin/products", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.data.status === 1) {
                    setProducts(response.data.data || []);
                } else {
                    setLoadingError(response.data.message || "Failed to load products.");
                }
            } catch (error) {
                console.error("Failed to fetch products:", error);

                if (error.response?.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/admin/login");
                    return;
                }

                setLoadingError(error.response?.data?.message || "Failed to load products.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [navigate, reloadCount]);

    // Search and filter
    const filteredProducts = products.filter((product) => {
        const searchText = search.toLowerCase().trim();

        const matchesSearch =
            product.productName?.toLowerCase().includes(searchText) ||
            product.description?.toLowerCase().includes(searchText) ||
            product.restaurantId?.restaurantName
                ?.toLowerCase()
                .includes(searchText) ||
            product.category?.toLowerCase().includes(searchText);

        const matchesAvailability =
            availabilityFilter === "All" ||
            (availabilityFilter === "Available" && product.available) ||
            (availabilityFilter === "Unavailable" && !product.available);

        return matchesSearch && matchesAvailability;
    });

    // Update product
    const handleUpdate = async (event) => {
        event.preventDefault();

        if (!editingProduct) return;

        const price = Number(editingProduct.price);

        if (!editingProduct.productName?.trim()) {
            setNotice("Product name is required.");
            return;
        }

        if (!Number.isFinite(price) || price < 0) {
            setNotice("Enter a valid price of zero or more.");
            return;
        }

        try {
            setSaving(true);
            setNotice("");

            const token = localStorage.getItem("token");

            const response = await apiClient.put(
                `/api/admin/products/${editingProduct._id}`,
                {
                    productName: editingProduct.productName.trim(),
                    description: editingProduct.description?.trim() || "",
                    price,
                    category: editingProduct.category?.trim() || "",
                    image: editingProduct.image?.trim() || "",
                    available: editingProduct.available,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                setProducts((previousProducts) =>
                    previousProducts.map((product) =>
                        product._id === editingProduct._id
                            ? {
                                  ...product,
                                  ...response.data.data,
                                  restaurantId: product.restaurantId,
                              }
                            : product
                    )
                );

                setEditingProduct(null);
                setNotice("Product updated successfully.");
            } else {
                setNotice(response.data.message || "Failed to update product.");
            }
        } catch (error) {
            console.error("Failed to update product:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/admin/login");
                return;
            }

            setNotice(error.response?.data?.message || "Failed to update product.");
        } finally {
            setSaving(false);
        }
    };

    // Delete product
    const handleDelete = async (productId) => {
        const confirmed = window.confirm(
            "Are you sure you want to permanently delete this product?"
        );

        if (!confirmed) return;

        try {
            setDeletingProductId(productId);
            setNotice("");
            const token = localStorage.getItem("token");

            const response = await apiClient.delete(
                `/api/admin/products/${productId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                setProducts((previousProducts) =>
                    previousProducts.filter(
                        (product) => product._id !== productId
                    )
                );

                setNotice("Product deleted successfully.");
            } else {
                setNotice(response.data.message || "Failed to delete product.");
            }
        } catch (error) {
            console.error("Failed to delete product:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/admin/login");
                return;
            }

            setNotice(error.response?.data?.message || "Failed to delete product.");
        } finally {
            setDeletingProductId(null);
        }
    };

    // Toggle availability
    const handleAvailability = async (product) => {
        try {
            setAvailabilityUpdatingId(product._id);
            setNotice("");
            const token = localStorage.getItem("token");

            const response = await apiClient.put(
                `/api/admin/products/${product._id}`,
                {
                    productName: product.productName,
                    description: product.description,
                    price: product.price,
                    category: product.category,
                    image: product.image,
                    available: !product.available,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                setProducts((previousProducts) =>
                    previousProducts.map((item) =>
                        item._id === product._id
                            ? { ...item, available: response.data.data.available }
                            : item
                    )
                );
                setNotice("Product availability updated.");
            } else {
                setNotice(response.data.message || "Failed to update availability.");
            }
        } catch (error) {
            console.error("Failed to update availability:", error);

            if (error.response?.status === 401) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/admin/login");
                return;
            }

            setNotice(error.response?.data?.message || "Failed to update availability.");
        } finally {
            setAvailabilityUpdatingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <AdminHeader />

            <div className="flex">
                <AdminSidebar />

                <main className="w-full min-w-0 p-6 md:p-8">
                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Products
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage food products from all restaurants.
                        </p>
                    </div>

                    {notice && (
                        <div role="status" className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                            {notice}
                        </div>
                    )}

                    {/* Total Products */}
                    <div className="mb-6 rounded-xl bg-white p-6 shadow-sm">
                        <p className="text-sm text-gray-500">
                            Total Products
                        </p>

                        <h2 className="mt-2 text-3xl font-bold text-gray-900">
                            {products.length}
                        </h2>
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm md:flex-row">
                        <input
                            type="text"
                            placeholder="Search product, restaurant or category..."
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        />

                        <select
                            value={availabilityFilter}
                            onChange={(event) =>
                                setAvailabilityFilter(event.target.value)
                            }
                            className="rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        >
                            <option value="All">All Products</option>
                            <option value="Available">Available</option>
                            <option value="Unavailable">Unavailable</option>
                        </select>
                    </div>

                    <p className="mb-3 text-sm text-gray-500">
                        Showing {filteredProducts.length} of {products.length} products
                    </p>

                    {/* Product List */}
                    {loading ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                            Loading products...
                        </div>
                    ) : loadingError ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                            <p className="mb-4 text-red-600">{loadingError}</p>
                            <button
                                type="button"
                                onClick={() => setReloadCount((count) => count + 1)}
                                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                            No products found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                            <table className="w-full min-w-[850px]">
                                <thead className="border-b bg-gray-50">
                                    <tr>
                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                                            Product
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                                            Restaurant
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                                            Category
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                                            Price
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                                            Availability
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="border-b last:border-0"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {product.image && (
                                                        <img
                                                            src={product.image}
                                                            alt={product.productName}
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />
                                                    )}

                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {product.productName}
                                                        </p>

                                                        <p className="max-w-xs truncate text-sm text-gray-500">
                                                            {product.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-gray-700">
                                                {product.restaurantId
                                                    ?.restaurantName || "Unknown"}
                                            </td>

                                            <td className="px-5 py-4 text-gray-700">
                                                {product.category}
                                            </td>

                                            <td className="px-5 py-4 font-semibold text-gray-900">
                                                ₹{product.price}
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    disabled={availabilityUpdatingId === product._id}
                                                    onClick={() => handleAvailability(product)}
                                                    className={`rounded-full px-3 py-1 text-sm font-semibold disabled:cursor-wait disabled:opacity-60 ${
                                                        product.available
                                                            ? "bg-green-100 text-green-700"
                                                            : "bg-red-100 text-red-700"
                                                    }`}
                                                >
                                                    {availabilityUpdatingId === product._id
                                                        ? "Updating..."
                                                        : product.available
                                                          ? "Available"
                                                          : "Unavailable"}
                                                </button>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() =>
                                                            setEditingProduct({
                                                                ...product,
                                                            })
                                                        }
                                                        className="font-medium text-blue-600 hover:text-blue-800"
                                                    >
                                                        Edit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={deletingProductId === product._id}
                                                        onClick={() => handleDelete(product._id)}
                                                        className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                                                    >
                                                        {deletingProductId === product._id ? "Deleting..." : "Delete"}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Edit Product Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
                    <form
                        onSubmit={handleUpdate}
                        className="my-8 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
                    >
                        <h2 className="mb-5 text-2xl font-bold text-gray-900">
                            Edit Product
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Product Name
                                </label>

                                <input
                                    type="text"
                                    required
                                    value={editingProduct.productName || ""}
                                    onChange={(event) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            productName: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Description
                                </label>

                                <textarea
                                    required
                                    value={editingProduct.description || ""}
                                    onChange={(event) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            description: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Price
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        required
                                        value={editingProduct.price}
                                        onChange={(event) =>
                                            setEditingProduct({
                                                ...editingProduct,
                                                price: event.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Category
                                    </label>

                                    <input
                                        type="text"
                                        required
                                        value={editingProduct.category || ""}
                                        onChange={(event) =>
                                            setEditingProduct({
                                                ...editingProduct,
                                                category: event.target.value,
                                            })
                                        }
                                        className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Image URL
                                </label>

                                <input
                                    type="text"
                                    value={editingProduct.image || ""}
                                    onChange={(event) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            image: event.target.value,
                                        })
                                    }
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                                />
                            </div>

                            <label className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={editingProduct.available}
                                    onChange={(event) =>
                                        setEditingProduct({
                                            ...editingProduct,
                                            available: event.target.checked,
                                        })
                                    }
                                    className="h-4 w-4"
                                />

                                <span className="text-sm text-gray-700">
                                    Product is available
                                </span>
                            </label>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setEditingProduct(null)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving}
                                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ManageProducts;