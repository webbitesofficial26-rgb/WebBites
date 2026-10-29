import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";

const AdminLogin = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let storedUser = null;

        try {
            const user = localStorage.getItem("user");
            storedUser = user ? JSON.parse(user) : null;
        } catch (error) {
            localStorage.removeItem("user");
        }

        if (localStorage.getItem("token") && storedUser?.role === "admin") {
            navigate("/admin", { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");
        setLoading(true);

        try {
            const response = await apiClient.post("/api/admin/login", {
                email: email.trim(),
                password,
            });
            const data = response.data;

            if (data.status !== 1 || !data.token || !data.data) {
                setErrorMessage(data.message || "Unable to sign in. Please check your details and try again.");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem(
                "user",
                JSON.stringify({ ...data.data, role: "admin" })
            );

            navigate("/admin", { replace: true });
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                "Admin login failed. Please check your connection and try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
            <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg sm:p-10">
                <div className="text-center">
                    <Link to="/" className="text-3xl font-extrabold text-gray-900">
                        Web<span className="text-red-500">Bites</span>
                    </Link>
                    <h1 className="mt-6 text-2xl font-bold text-gray-900">
                        Admin Login
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Sign in to manage the WebBites platform.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                        <label htmlFor="admin-email" className="text-sm font-medium text-gray-700">
                            Email address
                        </label>
                        <input
                            id="admin-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="admin@webbites.com"
                            autoComplete="username"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label htmlFor="admin-password" className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative mt-2">
                            <input
                                id="admin-password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((visible) => !visible)}
                                className="absolute inset-y-0 right-3 text-sm font-medium text-gray-500 hover:text-gray-800"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    {errorMessage && (
                        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500">
                    Return to{" "}
                    <Link to="/" className="font-semibold text-red-500 hover:text-red-600">
                        WebBites home
                    </Link>
                </p>
            </section>
        </main>
    );
};

export default AdminLogin;
