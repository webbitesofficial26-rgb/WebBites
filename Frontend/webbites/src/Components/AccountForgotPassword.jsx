import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../config/apiClient";

const AccountForgotPassword = () => {
  const { accountType } = useParams();
  const label = accountType === "restaurant" ? "Restaurant" : "Delivery Partner";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault(); setMessage(""); setError(""); setLoading(true);
    try {
      const response = await apiClient.post(`/api/account-password/forgot/${accountType}`, { email: email.trim().toLowerCase() });
      if (response.data?.status === 1) setMessage(response.data.message);
      else setError(response.data?.message || "Unable to process your request.");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send the reset request. Please try again.");
    } finally { setLoading(false); }
  };

  const loginPath = accountType === "restaurant" ? "/restaurant/login" : "/delivery/login";
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10"><div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
    <Link to="/" className="text-2xl font-extrabold text-gray-900">Web<span className="text-red-500">Bites</span></Link>
    <h1 className="mt-6 text-2xl font-bold text-gray-900">Forgot {label} Password?</h1>
    <p className="mt-2 text-sm text-gray-500">Enter the email address registered to your {label.toLowerCase()} account. We'll email you a reset link if an account exists.</p>
    {message && <div role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}
    {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    <form onSubmit={handleSubmit} className="mt-6 space-y-4"><label className="block text-sm font-medium text-gray-700">Registered email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500" placeholder="you@example.com" /></label><button disabled={loading} className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-60">{loading ? "Sending..." : "Send Reset Link"}</button></form>
    <Link to={loginPath} className="mt-6 block text-center text-sm font-semibold text-red-600 hover:text-red-700">Back to {label} Login</Link>
  </div></div>;
};
export default AccountForgotPassword;
