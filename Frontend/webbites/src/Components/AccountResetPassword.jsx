import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import apiClient from "../config/apiClient";

const AccountResetPassword = () => {
  const { accountType, token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const loginPath = accountType === "restaurant" ? "/restaurant/login" : "/delivery/login";

  const handleSubmit = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    if (password.length < 8) return setError("Password must contain at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const response = await apiClient.put(`/api/account-password/reset/${accountType}/${encodeURIComponent(token)}`, { password });
      if (response.data?.status === 1) { setMessage(response.data.message); setTimeout(() => navigate(loginPath), 1400); }
      else setError(response.data?.message || "Unable to reset password.");
    } catch (requestError) { setError(requestError.response?.data?.message || "Unable to reset password. Please request a new link."); }
    finally { setLoading(false); }
  };
  const validType = ["restaurant", "delivery"].includes(accountType);
  return <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10"><div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"><Link to="/" className="text-2xl font-extrabold text-gray-900">Web<span className="text-red-500">Bites</span></Link><h1 className="mt-6 text-2xl font-bold text-gray-900">Reset Password</h1><p className="mt-2 text-sm text-gray-500">Choose a new password with at least 8 characters.</p>
    {!validType && <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">Invalid reset link.</div>}
    {message && <div role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</div>}{error && <div role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {validType && <form onSubmit={handleSubmit} className="mt-6 space-y-4"><label className="block text-sm font-medium text-gray-700">New password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500" /></label><label className="block text-sm font-medium text-gray-700">Confirm new password<input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" minLength={8} required className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500" /></label><button disabled={loading} className="w-full rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-red-500 disabled:opacity-60">{loading ? "Resetting..." : "Reset Password"}</button></form>}
    <Link to={loginPath} className="mt-6 block text-center text-sm font-semibold text-red-600 hover:text-red-700">Back to Login</Link>
  </div></div>;
};
export default AccountResetPassword;
