
import { useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/apiClient";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

  
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        try {
            setLoading(true);

            const response = await apiClient.post(
                "/api/forget-password",
                { email: email.trim().toLowerCase() }
            );

            if (response.data.status === 1) {
                setMessage(
                    response.data.message ||
                    "If an account exists with that email, a reset link will be sent."
                );
            } else {
                setError(response.data.message || "Unable to process your request.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to send the reset request. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-bold text-orange-600">
                        WebBites
                    </h1>
                    <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                        Forgot Password?
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        Enter your registered email address to receive a password reset link.
                    </p>
                </div>

                {message && (
                    <div
                        role="status"
                        className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700"
                    >
                        {message}
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="email"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Email Address
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

