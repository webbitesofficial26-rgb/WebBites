import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../config/apiClient";

const Login = () => {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  
  useEffect(() => {
    emailRef.current.focus();
  }, []);

  
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
    } else if (password.length < 6) {
      newErrors.password =
        "Password must be at least 6 characters";
    }

    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);

      if (newErrors.email) {
        emailRef.current.focus();
      } else if (newErrors.password) {
        passwordRef.current.focus();
      }

      return;
    }

    try {
      setLoading(true);

      
      const response = await apiClient.post(
        "/api/login",
        {
          email: email,
          password: password,
        }
      );

      const data = response.data;

      
      if (data.status === 1) {
          localStorage.setItem("token", data.token);

          localStorage.setItem(
              "user",
              JSON.stringify({...data.data,  role: "customer"})
          );

          navigate("/");
      } else {
        
        setErrors({
          general: data.message,
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">

      <div className="w-full max-w-md">

        
        <div className="mb-8 text-center">

          <Link
            to="/"
            className="text-3xl font-extrabold text-gray-900"
          >
            Web<span className="text-red-500">Bites</span>
          </Link>

          <p className="mt-3 text-gray-500">
            Welcome back! Login to continue.
          </p>

        </div>

        
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">

          <h1 className="text-2xl font-bold text-gray-900">
            Login
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Login to order your favorite food.
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
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Email
              </label>

              <input
                ref={emailRef}
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
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
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
            <div className="mt-2 text-right">
              <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700"
              >
                  Forgot Password?
              </Link>
          </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          
          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}

            <Link
              to="/register"
              className="font-semibold text-red-500 hover:text-red-600"
            >
              Create an account
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

export default Login;