import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";

const DeliveryRegister = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    deliveryName: "",
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      deliveryName,
      email,
      phone,
      address,
      password,
      confirmPassword,
    } = formData;

    const newErrors = {};

    if (!deliveryName.trim()) {
      newErrors.deliveryName =
        "Delivery name is required";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phone)) {
      newErrors.phone =
        "Phone number must be 10 digits";
    }

    if (!address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword =
        "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const deliveryData = {
        deliveryName,
        email,
        phone,
        address,
        password,
      };

      const response = await apiClient.post("/api/add-delivery",
        deliveryData
      );

      const data = response.data;

      if (data.status === 1) {
        alert("Registration submitted successfully! Check your email for confirmation. Your account must be approved by an admin before you can log in.");
        navigate("/delivery/login");
      } else {
        setErrors({
          general: data.message || "Registration failed",
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xl">
              🕷️
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Web<span className="text-red-500">Bites</span>
            </h1>
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mt-6">
            Delivery Partner Registration
          </h2>

          <p className="text-gray-500 mt-2">
            Create your delivery partner account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {errors.general && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name
              </label>

              <input
                type="text"
                name="deliveryName"
                value={formData.deliveryName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />

              {errors.deliveryName && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.deliveryName}
                </p>
              )}
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />

                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10 digit phone number"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                />

                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phone}
                  </p>
                )}
              </div>

            </div>

            {/* Address */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Address
              </label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter your address"
                rows="3"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />

              {errors.address && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.address}
                </p>
              )}
            </div>

            {/* Password + Confirm Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 outline-none focus:border-red-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 hover:text-red-500"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-16 outline-none focus:border-red-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500 hover:text-red-500"
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>

                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Register as Delivery Partner
            </button>

          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              to="/delivery/login"
              className="font-semibold text-red-500 hover:text-red-600"
            >
              Delivery Login
            </Link>
          </p>

        </div>

        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-500 hover:text-red-500"
          >
            ← Back to WebBites
          </Link>
        </div>

      </div>
    </div>
  );
};

export default DeliveryRegister;