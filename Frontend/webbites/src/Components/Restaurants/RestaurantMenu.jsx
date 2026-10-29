import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../config/apiClient";
import RestaurantSidebar from "./RestaurantSidebar";

const RestaurantMenu = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [availabilityFilter, setAvailabilityFilter] = useState("All");
    const [productActions, setProductActions] = useState({});

    const updateProductAction = (id, updates) => {
        setProductActions((previous) => ({
            ...previous,
            [id]: { ...previous[id], ...updates },
        }));
    };

    const fetchProducts = async () => {
        setLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please login as a restaurant.");
                setProducts([]);
                return;
            }

            const response = await apiClient.get(
                "/api/my-products",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            if (data.status === 1) {
                setProducts(Array.isArray(data.data) ? data.data : []);
            } else {
                setError(
                    data.message || "Unable to fetch products"
                );
            }

        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to connect to server"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const filteredProducts = products.filter((product) => {
        const matchesSearch = !normalizedSearch || [product.productName, product.description, product.category]
            .some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
        const matchesCategory = categoryFilter === "All" || String(product.category || "").trim() === categoryFilter;
        const matchesAvailability = availabilityFilter === "All" ||
            (availabilityFilter === "Available" ? Boolean(product.available) : !product.available);
        return matchesSearch && matchesCategory && matchesAvailability;
    });

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("All");
        setAvailabilityFilter("All");
    };

    const handleDelete = async (id) => {
        if (productActions[id]?.busy) return;

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this product?"
        );

        if (!confirmDelete) return;

        const token = localStorage.getItem("token");
        if (!token) {
            updateProductAction(id, { message: "Please login as a restaurant to delete products.", isError: true });
            return;
        }

        updateProductAction(id, { busy: true, action: "delete", message: "Deleting product…", isError: false });

        try {
            const response = await apiClient.delete(
                `/api/delete-product/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            if (data.status === 1) {
                setProducts((previous) => previous.filter((product) => product._id !== id));
            } else {
                updateProductAction(id, { message: data.message || "Failed to delete product. Please try again.", isError: true });
            }
        } catch (error) {
            updateProductAction(id, {
                message: error.response?.data?.message || "Unable to delete product. Please try again.",
                isError: true,
            });
        } finally {
            setProductActions((previous) => ({
                ...previous,
                [id]: { ...previous[id], busy: false, action: "" },
            }));
        }
    };

    const handleToggleAvailability = async (id) => {
        if (productActions[id]?.busy) return;

        const token = localStorage.getItem("token");
        if (!token) {
            updateProductAction(id, { message: "Please login as a restaurant to update availability.", isError: true });
            return;
        }

        updateProductAction(id, { busy: true, action: "availability", message: "Updating availability…", isError: false });

        try {
            const response = await apiClient.put(
                `/api/update-product-availability/${id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = response.data;
            if (data.status === 1) {
                setProducts((previous) => previous.map((product) =>
                    product._id === id
                        ? { ...product, available: data.data.available }
                        : product
                ));
                updateProductAction(id, { message: "Availability updated successfully.", isError: false });
            } else {
                updateProductAction(id, { message: data.message || "Failed to update availability. Please try again.", isError: true });
            }
        } catch (error) {
            updateProductAction(id, {
                message: error.response?.data?.message || "Unable to update availability. Please try again.",
                isError: true,
            });
        } finally {
            setProductActions((previous) => ({
                ...previous,
                [id]: { ...previous[id], busy: false, action: "" },
            }));
        }
    };


    return (
        <div className="min-h-screen bg-gray-50">

            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

                    <Link
                        to="/"
                        className="flex items-center gap-2"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xl">
                            🕷️
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Web<span className="text-red-500">
                                Bites
                            </span>
                        </h1>
                    </Link>

                    <Link
                        to="/restaurant"
                        className="text-sm font-semibold text-gray-600 hover:text-red-500"
                    >
                        Dashboard
                    </Link>

                </div>
            </header>

            {/* Main */}
            <div className="flex">
                <RestaurantSidebar />
                <main className="min-w-0 flex-1 px-6 py-10">

                {/* Page Heading */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">
                            My Menu
                        </h2>

                        <p className="mt-2 text-gray-500">
                            Manage your restaurant products.
                        </p>
                    </div>

                    <Link
                        to="/restaurant/menu/add"
                        className="rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-red-500"
                    >
                        + Add Product
                    </Link>

                </div>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 sm:flex-row sm:items-center sm:justify-between">
                        <p role="alert">{error}</p>
                        <button type="button" onClick={fetchProducts} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold hover:bg-red-100">Try Again</button>
                    </div>
                )}

                {/* Menu search and filters */}
                {!loading && products.length > 0 && (
                    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5" aria-label="Filter menu products">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <label className="block text-sm font-medium text-gray-700 lg:col-span-2">
                                Search menu
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Food name, description, or category"
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-base outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
                                />
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Category
                                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base">
                                    <option value="All">All categories</option>
                                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm font-medium text-gray-700">
                                Availability
                                <select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base">
                                    <option value="All">All items</option>
                                    <option value="Available">Available</option>
                                    <option value="Unavailable">Unavailable</option>
                                </select>
                            </label>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
                            <p aria-live="polite">Showing {filteredProducts.length} of {products.length} products</p>
                            <button type="button" onClick={clearFilters} className="rounded-lg border border-gray-300 px-3 py-2 font-semibold text-gray-700 hover:bg-gray-50">Clear filters</button>
                        </div>
                    </section>
                )}

                {/* Loading */}
                {loading ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                        <p className="text-gray-500">
                            Loading products...
                        </p>
                    </div>
                ) : products.length === 0 ? (

                    /* No Products */
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">

                        <div className="text-5xl mb-4">
                            🍽️
                        </div>

                        <h3 className="text-xl font-bold text-gray-900">
                            No products yet
                        </h3>

                        <p className="mt-2 text-gray-500">
                            Start building your menu by adding your first product.
                        </p>

                        <Link
                            to="/restaurant/menu/add"
                            className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-red-500"
                        >
                            Add Your First Product
                        </Link>

                    </div>

                ) : filteredProducts.length === 0 ? (
                    <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
                        <div className="mb-4 text-5xl" aria-hidden="true">🔎</div>
                        <h3 className="text-xl font-bold text-gray-900">No matching products</h3>
                        <p className="mt-2 text-gray-500">Try another search term or change your filters.</p>
                        <button type="button" onClick={clearFilters} className="mt-5 rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-red-500">Clear filters</button>
                    </div>
                ) : (

                    /* Products */
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">

                        {filteredProducts.map((product) => (

                            <div
                                key={product._id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                            >

                                {/* Image */}
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.productName}
                                        className="h-48 w-full object-cover"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex h-48 items-center justify-center bg-gray-100 text-5xl">
                                        🍽️
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-5">

                                    <div className="flex items-start justify-between gap-3">

                                        <h3 className="text-lg font-bold text-gray-900">
                                            {product.productName}
                                        </h3>

                                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
                                            {product.category}
                                        </span>

                                    </div>

                                    <span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${product.dietaryType === "veg" ? "border-green-600 text-green-700" : product.dietaryType === "nonveg" ? "border-red-600 text-red-700" : "border-amber-500 text-amber-700"}`}>
                                        <span className={`inline-block h-2 w-2 rounded-full ${product.dietaryType === "veg" ? "bg-green-600" : product.dietaryType === "nonveg" ? "bg-red-600" : "bg-amber-500"}`} />
                                        {product.dietaryType === "veg" ? "VEG" : product.dietaryType === "nonveg" ? "NON-VEG" : "TYPE NOT SET"}
                                    </span>

                                    <p className="mt-2 text-sm text-gray-500">
                                        {product.description}
                                    </p>

                                    {productActions[product._id]?.message && (
                                        <p
                                            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
                                                productActions[product._id].isError
                                                    ? "bg-red-50 text-red-700"
                                                    : "bg-gray-50 text-gray-600"
                                            }`}
                                            role={productActions[product._id].isError ? "alert" : "status"}
                                        >
                                            {productActions[product._id].message}
                                        </p>
                                    )}

                                    <div className="mt-5 flex items-center justify-between">

                                        <p className="text-xl font-bold text-gray-900">
                                            ₹{product.price}
                                        </p>

                                        <span
                                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                product.available
                                                    ? "bg-green-50 text-green-600"
                                                    : "bg-gray-100 text-gray-500"
                                            }`}
                                        >
                                            {product.available
                                                ? "Available"
                                                : "Unavailable"}
                                        </span>

                                    </div>

                                    {/* Buttons */}
                                    <div className="mt-5 flex flex-col gap-3 sm:flex-row">

                                        <Link
                                            to={`/restaurant/menu/edit/${product._id}`}
                                            className="flex-1 rounded-lg border border-gray-300 py-2 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                            Edit
                                        </Link>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleAvailability(product._id)}
                                            disabled={Boolean(productActions[product._id]?.busy)}
                                            className={`flex-1 rounded-lg py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                                                product.available
                                                    ? "border border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                                                    : "border border-green-200 text-green-600 hover:bg-green-50"
                                            }`}
                                        >
                                            {productActions[product._id]?.action === "availability" && productActions[product._id]?.busy
                                                ? "Updating…"
                                                : product.available ? "Mark Unavailable" : "Mark Available"}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleDelete(product._id)}
                                            disabled={Boolean(productActions[product._id]?.busy)}
                                            className="flex-1 rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {productActions[product._id]?.action === "delete" && productActions[product._id]?.busy ? "Deleting…" : "Delete"}
                                        </button>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

                </main>
            </div>
        </div>
    );
};

export default RestaurantMenu;
