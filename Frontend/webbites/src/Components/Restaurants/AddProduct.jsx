
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../../config/apiClient";
import RestaurantSidebar from "./RestaurantSidebar";

const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    price: "",
    category: "",
    dietaryType: "veg",
  });

  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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

    setImage(selectedImage || null);

    setErrors((prev) => ({
      ...prev,
      image: "",
      general: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { productName, description, price, category, dietaryType } = formData;

    const newErrors = {};

    if (!productName.trim()) {
      newErrors.productName = "Product name is required";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!price) {
      newErrors.price = "Price is required";
    } else if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!image) {
      newErrors.image = "Please select a product image";
    } else if (!image.type.startsWith("image/")) {
      newErrors.image = "Please select a valid image file";
    } else if (image.size > 5 * 1024 * 1024) {
      newErrors.image = "Image size must not exceed 5 MB";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);

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
      productData.append("price", price);
      productData.append("category", category.trim());
      productData.append("dietaryType", dietaryType);
      productData.append("image", image);

      const response = await apiClient.post(
        "/api/add-product",
        productData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = response.data;

      if (data.status === 1) {
        alert("Product added successfully!");

        setFormData({
          productName: "",
          description: "",
          price: "",
          category: "",
          dietaryType: "veg",
        });

        setImage(null);

        navigate("/restaurant/menu");
      } else {
        setErrors({
          general: data.message || "Failed to add product",
        });
      }
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message ||
          "Unable to connect to server",
      });
    } finally {
      setLoading(false);
    }
  };

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
            to="/restaurant"
            className="text-sm font-semibold text-gray-600 hover:text-red-500"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main */}
      <div className="flex">
        <RestaurantSidebar />
        <main className="min-w-0 flex-1 px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Add Product
          </h2>

          <p className="mt-2 text-gray-500">
            Add a new item to your restaurant menu.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {/* General Error */}
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
                placeholder="Example: Chicken Biryani"
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
                placeholder="Describe your product"
                rows="4"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />

              {errors.description && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.description}
                </p>
              )}
            </div>

            {/* Price + Category */}
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
                  placeholder="Example: 250"
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
                  placeholder="Example: Biryani"
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
                <option value="veg">🟢 Vegetarian (Veg)</option>
                <option value="nonveg">🔴 Non-Vegetarian (Non-Veg)</option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="mb-7">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Product Image
              </label>

              <input
                type="file"
                name="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />

              <p className="mt-1 text-xs text-gray-400">
                Select an image from your device. Maximum size: 5 MB.
              </p>

              {image && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {image.name}
                </p>
              )}

              {errors.image && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.image}
                </p>
              )}
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
                disabled={loading}
                className="flex-1 rounded-lg bg-gray-900 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Product"}
              </button>
            </div>
          </form>
        </div>
        </main>
      </div>
    </div>
  );
};

export default AddProduct;

