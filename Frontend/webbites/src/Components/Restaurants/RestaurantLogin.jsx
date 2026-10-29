import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";

const RestaurantLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

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

    const { email, password } = formData;
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await apiClient.post(
        "/api/restaurant-login",
        formData
      );

      const data = response.data;

      if (data.status === 1) {

          localStorage.setItem("token",data.token);

          localStorage.setItem("user",JSON.stringify({...data.data,  role: "restaurant"}));

          alert("Restaurant login successful!");

          navigate("/restaurant");

      } else {
          setErrors({
              general:
                  data.message ||
                  "Invalid email or password"
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xl">
              🕷️
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Web<span className="text-red-500">Bites</span>
            </h1>
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mt-6">
            Restaurant Login
          </h2>

          <p className="text-gray-500 mt-2">
            Login to manage your restaurant
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

          {/* General Error */}
          {errors.general && (
            <div className="mb-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter restaurant email"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              />

              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none focus:border-red-500"
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

            {/* Login Button */}
            <button
              type="submit"
              className="w-full rounded-lg bg-gray-900 py-3 font-semibold text-white transition hover:bg-red-500"
            >
              Login
            </button>
          </form>

          <div className="mb-5 text-right"><Link to="/restaurant/forgot-password" className="text-sm font-semibold text-red-600 hover:text-red-700">Forgot Password?</Link></div>

          {/* Register */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have a restaurant account?{" "}
            <Link
              to="/restaurant/register"
              className="font-semibold text-red-500 hover:text-red-600"
            >
              Register Restaurant
            </Link>
          </p>
        </div>

        {/* Back */}
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

export default RestaurantLogin;