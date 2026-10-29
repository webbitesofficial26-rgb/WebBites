
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../../config/apiClient";
import RestaurantSidebar from "./RestaurantSidebar";

const EditProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        productName: "",
        description: "",
        price: "",
        category: "",
        dietaryType: "",
        image: "",
        available: true,
    });

    const [newImage, setNewImage] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const token = localStorage.getItem("token");

                if (!token) {
                    setErrors({
                        general: "Please login as a restaurant first.",
                    });
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
                    const product = data.data.find(
                        (item) => item._id === id
                    );

                    if (!product) {
                        setErrors({
                            general: "Product not found",
                        });
                        return;
                    }

                    setFormData({
                        productName: product.productName || "",
                        description: product.description || "",
                        price: product.price ?? "",
                        category: product.category || "",
                        dietaryType: product.dietaryType || "",
                        image: product.image || "",
                        available: product.available ?? true,
                    });
                } else {
                    setErrors({
                        general: data.message || "Failed to fetch product",
                    });
                }
            } catch (error) {
                setErrors({
                    general:
                        error.response?.data?.message ||
                        "Unable to fetch product",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        setErrors((prev) => ({
            ...prev,
            [name]: "",
            general: "",
        }));
    };

    const handleImageChange = (e) => {
        const selectedImage = e.target.files[0];

        setNewImage(selectedImage || null);

        setErrors((prev) => ({
            ...prev,
            image: "",
            general: "",
        }));
    };

    const handleAvailableChange = (e) => {
        setFormData((prev) => ({
            ...prev,
            available: e.target.checked,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const {
            productName,
            description,
            price,
            category,
            dietaryType,
            available,
        } = formData;

        const newErrors = {};

        if (!productName.trim()) {
            newErrors.productName = "Product name is required";
        }

        if (!description.trim()) {
            newErrors.description = "Description is required";
        }

        if (
            price === "" ||
            !Number.isFinite(Number(price)) ||
            Number(price) <= 0
        ) {
            newErrors.price = "Enter a valid price";
        }

        if (!category.trim()) {
            newErrors.category = "Category is required";
        }

        if (!["veg", "nonveg"].includes(dietaryType)) {
            newErrors.dietaryType = "Please select whether this item is veg or non-veg";
        }

        if (newImage) {
            if (!newImage.type.startsWith("image/")) {
                newErrors.image = "Please select a valid image file";
            } else if (newImage.size > 5 * 1024 * 1024) {
                newErrors.image = "Image size must not exceed 5 MB";
            }
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setSaving(true);

            const token = localStorage.getItem("token");

            if (!token) {
                setErrors({
                    general: "Please login as a restaurant first.",
                });
                return;
            }

            const productData = new FormData();

            productData.append("productName", productName.trim());
            productData.append("description", description.trim());
            productData.append("price", String(Number(price)));
            productData.append("category", category.trim());
            productData.append("dietaryType", dietaryType);
            productData.append("available", String(available));

            // Only upload a file if the user selected a new image.
            // Otherwise, the backend keeps the existing image.
            if (newImage) {
                productData.append("image", newImage);
            }

            const response = await apiClient.put(
                `/api/update-product/${id}`,
                productData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = response.data;

            if (data.status === 1) {
                alert("Product updated successfully!");
                navigate("/restaurant/menu");
            } else {
                setErrors({
                    general: data.message || "Failed to update product",
                });
            }
        } catch (error) {
            setErrors({
                general:
                    error.response?.data?.message ||
                    "Unable to update product",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <p className="text-gray-500">Loading product...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xl">
                            🕷️
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Web<span className="text-red-500">Bites</span>
                        </h1>
                    </Link>

                    <Link
                        to="/restaurant/menu"
                        className="text-sm font-semibold text-gray-600 hover:text-red-500"
                    >
                        Back to Menu
                    </Link>
                </div>
            </header>

            {/* Main */}
            <div className="flex">
                <RestaurantSidebar />
                <main className="min-w-0 flex-1 px-6 py-10">
                <h2 className="text-3xl font-bold text-gray-900">
                    Edit Product
                </h2>

                <p className="mt-2 mb-8 text-gray-500">
                    Update your menu item details.
                </p>

                <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                    {errors.general && (
                        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                            {errors.general}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Product Name */}
                        <div className="mb-5">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Product Name
                            </label>

                            <input
                                type="text"
                                name="productName"
                                value={formData.productName}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                            />

                            {errors.productName && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.productName}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mb-5">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Description
                            </label>

                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                            />

                            {errors.description && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Price and Category */}
                        <div className="mb-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Price
                                </label>

                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="1"
                                    step="any"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                                />

                                {errors.price && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.price}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Category
                                </label>

                                <input
                                    type="text"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                                />

                                {errors.category && (
                                    <p className="mt-1 text-sm text-red-500">
                                        {errors.category}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <label htmlFor="dietaryType" className="mb-2 block text-sm font-semibold text-gray-700">
                                Food Type
                            </label>
                            <select
                                id="dietaryType"
                                name="dietaryType"
                                value={formData.dietaryType}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-red-500"
                            >
                                <option value="">Choose food type</option>
                                <option value="veg">🟢 Vegetarian (Veg)</option>
                                <option value="nonveg">🔴 Non-Vegetarian (Non-Veg)</option>
                            </select>
                            {errors.dietaryType && (
                                <p className="mt-1 text-sm text-red-500">{errors.dietaryType}</p>
                            )}
                        </div>

                        {/* Current Image */}
                        <div className="mb-5">
                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Current Product Image
                            </label>

                            {formData.image ? (
                                <img
                                    src={formData.image}
                                    alt={formData.productName || "Product"}
                                    className="mb-3 h-40 w-40 rounded-lg border border-gray-200 object-cover"
                                />
                            ) : (
                                <p className="mb-3 text-sm text-gray-500">
                                    No image available.
                                </p>
                            )}

                            <label className="mb-2 block text-sm font-semibold text-gray-700">
                                Choose a New Image (Optional)
                            </label>

                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                            />

                            <p className="mt-1 text-xs text-gray-400">
                                Leave empty to keep the current image.
                                Maximum size: 5 MB.
                            </p>

                            {newImage && (
                                <p className="mt-2 text-sm text-gray-600">
                                    New image selected: {newImage.name}
                                </p>
                            )}

                            {errors.image && (
                                <p className="mt-1 text-sm text-red-500">
                                    {errors.image}
                                </p>
                            )}
                        </div>

                        {/* Availability */}
                        <div className="mb-7 flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={formData.available}
                                onChange={handleAvailableChange}
                                className="h-4 w-4"
                            />

                            <label className="text-sm font-semibold text-gray-700">
                                Product Available
                            </label>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Link
                                to="/restaurant/menu"
                                className="flex-1 rounded-lg border border-gray-300 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 rounded-lg bg-gray-900 py-3 font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                </div>
                </main>
            </div>
        </div>
    );
};

export default EditProduct;

