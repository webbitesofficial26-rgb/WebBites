import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../config/apiClient";

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, phone, password, confirmPassword } = formData;

    const newErrors = {};

   
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    }

    
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(phone)) {
      newErrors.phone = "Phone number should be 10 digits";
    }

    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
  setLoading(true);

  const userData = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    password: formData.password,
  };

  const response = await apiClient.post("/api/add-user",
    userData
  );

  const data = response.data;

  if (data.status === 1) {
    alert("Registration successful!");
    navigate("/login");
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
} finally {
  setLoading(false);
}
  };

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">

     
      <div className="mx-auto w-full max-w-lg">

        
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="text-3xl font-extrabold text-gray-900"
          >
            Web<span className="text-red-500">Bites</span>
          </Link>

          <p className="mt-3 text-gray-500">
            Create your account and start ordering delicious food.
          </p>
        </div>

       
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

          <h1 className="text-2xl font-bold text-gray-900">
            Create your account
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Join WebBites and order your favorite food.
          </p>

         
          {errors.general && (
            <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {errors.general}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-5"
          >

           
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className={`w-full rounded-xl border px-4 py-3 outline-none ${
                  errors.name
                    ? "border-red-500"
                    : "border-gray-300 focus:border-red-500"
                }`}
              />

              {errors.name && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.name}
                </p>
              )}
            </div>

           
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
                placeholder="Enter your email"
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
                placeholder="Enter your phone number"
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
                  type={showPassword ? "text" : "password"}
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
                  placeholder="Confirm your password"
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
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-500">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>

          </form>

         
          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-red-500 hover:text-red-600"
            >
              Login
            </Link>
          </p>

        </div>

       
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

export default Register;