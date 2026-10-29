import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";

const RestaurantRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    restaurantName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // Handle input changes
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

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      restaurantName,
      ownerName,
      email,
      phone,
      address,
      password,
      confirmPassword,
    } = formData;

    const newErrors = {};

    // Restaurant name validation
    if (!restaurantName.trim()) {
      newErrors.restaurantName =
        "Restaurant name is required";
    }

    // Owner name validation
    if (!ownerName.trim()) {
      newErrors.ownerName =
        "Owner name is required";
    }

    // Email validation
    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    // Phone validation
    if (!phone.trim()) {
      newErrors.phone =
        "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phone)) {
      newErrors.phone =
        "Phone number should be 10 digits";
    }

    // Address validation
    if (!address.trim()) {
      newErrors.address =
        "Restaurant address is required";
    }

    // Password validation
    if (!password) {
      newErrors.password =
        "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    // Stop if validation fails
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Data sent to backend
      const restaurantData = {
        restaurantName,
        ownerName,
        email,
        phone,
        address,
        password,
      };

      const response = await apiClient.post(
        "/api/add-restaurant",
        restaurantData
      );

      const data = response.data;

      if (data.status === 1) {
        alert("Registration submitted successfully! Check your email for confirmation. Your restaurant must be approved by an admin before you can log in.");

        navigate("/restaurant/login");
      } else {
        setErrors({
          general:
            data.message || "Registration failed",
        });
      }
    } catch (error) {
      setErrors({
        general:
          error.response?.data?.message ||
          "Unable to connect to server",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">

      <div className="mx-auto w-full max-w-2xl">

        {/* Logo */}
        <div className="mb-8 text-center">

          <Link
            to="/"
            className="text-3xl font-extrabold text-gray-900"
          >
            Web<span className="text-red-500">Bites</span>
          </Link>

          <p className="mt-3 text-gray-500">
            Partner with WebBites and grow your restaurant.
          </p>

        </div>

        {/* Registration Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Register Your Restaurant
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Create your restaurant account and start
              receiving orders from customers.
            </p>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >

            {/* Restaurant Name */}
            <div>
              <label
                htmlFor="restaurantName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Restaurant Name
              </label>

              <input
                id="restaurantName"
                name="restaurantName"
                type="text"
                value={formData.restaurantName}
                onChange={handleChange}
                placeholder="Enter restaurant name"
                className={`w-full rounded-xl border px-4 py-3 outline-none ${
                  errors.restaurantName
                    ? "border-red-500"
                    : "border-gray-300 focus:border-red-500"
                }`}
              />

              {errors.restaurantName && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.restaurantName}
                </p>
              )}
            </div>

            {/* Owner Name */}
            <div>
              <label
                htmlFor="ownerName"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Owner Name
              </label>

              <input
                id="ownerName"
                name="ownerName"
                type="text"
                value={formData.ownerName}
                onChange={handleChange}
                placeholder="Enter owner name"
                className={`w-full rounded-xl border px-4 py-3 outline-none ${
                  errors.ownerName
                    ? "border-red-500"
                    : "border-gray-300 focus:border-red-500"
                }`}
              />

              {errors.ownerName && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.ownerName}
                </p>
              )}
            </div>

            {/* Email and Phone */}
            <div className="grid gap-5 md:grid-cols-2">

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    errors.email
                      ? "border-red-500"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                />

                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Phone Number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength="10"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={`w-full rounded-xl border px-4 py-3 outline-none ${
                    errors.phone
                      ? "border-red-500"
                      : "border-gray-300 focus:border-red-500"
                  }`}
                />

                {errors.phone && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>

            </div>

            {/* Address */}
            <div>
              <label
                htmlFor="address"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Restaurant Address
              </label>

              <textarea
                id="address"
                name="address"
                rows="3"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter complete restaurant address"
                className={`w-full resize-none rounded-xl border px-4 py-3 outline-none ${
                  errors.address
                    ? "border-red-500"
                    : "border-gray-300 focus:border-red-500"
                }`}
              />

              {errors.address && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Password and Confirm Password */}
            <div className="grid gap-5 md:grid-cols-2">

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Password
                </label>

                <div className="relative">

                  <input
                    id="password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className={`w-full rounded-xl border px-4 py-3 pr-16 outline-none ${
                      errors.password
                        ? "border-red-500"
                        : "border-gray-300 focus:border-red-500"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>

                </div>

                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Confirm Password
                </label>

                <div className="relative">

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className={`w-full rounded-xl border px-4 py-3 pr-16 outline-none ${
                      errors.confirmPassword
                        ? "border-red-500"
                        : "border-gray-300 focus:border-red-500"
                    }`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

                {errors.confirmPassword && (
                  <p className="mt-2 text-sm text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600"
            >
              Register Restaurant
            </button>

          </form>

          {/* Login */}
          <p className="mt-6 text-center text-sm text-gray-500">
            Already registered?{" "}

            <Link
              to="/restaurant/login"
              className="font-semibold text-red-500 hover:text-red-600"
            >
              Restaurant Login
            </Link>
          </p>

        </div>

        {/* Back */}
        <div className="mt-6 text-center">

          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to WebBites
          </Link>

        </div>

      </div>
    </div>
  );
};

export default RestaurantRegister;