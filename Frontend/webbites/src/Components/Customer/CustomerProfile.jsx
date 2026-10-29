import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";



const CustomerProfile = () => {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "", address: "", addresses: [], profilePicture: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await apiClient.get("/api/customer/profile", { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.status === 1) {
          const data = response.data.data || {};
          const addresses = Array.isArray(data.addresses) && data.addresses.length
            ? data.addresses
            : data.address?.trim() ? [{ label: "Home", address: data.address, isDefault: true }] : [];
          const defaultAddress = addresses.find((item) => item.isDefault)?.address || data.address || "";
          setProfile({ name: data.name || "", email: data.email || "", phone: data.phone || "", address: defaultAddress, addresses, profilePicture: data.profilePicture || "" });
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          setMessage(error.response?.data?.message || "Unable to load your profile.");
          setMessageError(true);
        }
      } finally { setLoading(false); }
    };
    fetchProfile();
  }, [navigate]);

  const handleChange = (e) => setProfile((current) => ({ ...current, [e.target.name]: e.target.value }));
  const setDefaultAddress = (selectedAddress) => setProfile((current) => ({
    ...current,
    address: selectedAddress,
    addresses: current.addresses.map((item) => ({ ...item, isDefault: item.address === selectedAddress })),
  }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (profile.phone && !/^\d{10}$/.test(profile.phone.trim())) {
      setMessage("Please enter a valid 10-digit phone number."); setMessageError(true); return;
    }
    try {
      setSaving(true); setMessage("");
      const response = await apiClient.put("/api/customer/profile", {
        name: profile.name, phone: profile.phone,
        addresses: profile.addresses.map((item) => ({ ...item, isDefault: item.address === profile.address })),
      }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (response.data.status === 1) {
        const data = response.data.data || {};
        setProfile((current) => ({ ...current, ...data, addresses: data.addresses || current.addresses }));
        setMessage("Profile updated successfully."); setMessageError(false);
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...stored, name: data.name || profile.name, profilePicture: data.profilePicture || profile.profilePicture }));
        } catch { /* Profile is already saved on the server. */ }
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update profile."); setMessageError(true);
    } finally { setSaving(false); }
  };

  const handlePicture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessage("Choose an image file."); setMessageError(true); event.target.value = ""; return; }
    if (file.size > 5 * 1024 * 1024) { setMessage("Profile pictures must be 5 MB or smaller."); setMessageError(true); event.target.value = ""; return; }
    try {
      setUploadingPicture(true); setMessage("");
      const formData = new FormData(); formData.append("image", file);
      const response = await apiClient.put("/api/customer/profile-picture", formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (response.data.status === 1) {
        const picture = response.data.data.profilePicture;
        setProfile((current) => ({ ...current, profilePicture: picture }));
        try { const stored = JSON.parse(localStorage.getItem("user") || "{}"); localStorage.setItem("user", JSON.stringify({ ...stored, profilePicture: picture })); } catch { /* Ignore stale cache. */ }
        setMessage("Profile picture updated successfully."); setMessageError(false);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to upload profile picture. Check Cloudinary configuration."); setMessageError(true);
    } finally { setUploadingPicture(false); if (fileInput.current) fileInput.current.value = ""; }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><p className="text-gray-500">Loading profile...</p></div>;

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-8 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <button type="button" onClick={() => navigate(-1)} className="mb-4 text-sm font-medium text-red-500 hover:text-red-600">← Back</button>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-2 text-gray-500">Manage your personal information, profile picture, and saved addresses.</p>
        </div>

        <section className="mb-5 flex flex-col items-center gap-4 rounded-xl bg-white p-6 shadow-sm sm:flex-row sm:items-center">
          {profile.profilePicture ? <img src={profile.profilePicture} alt="Profile" className="h-24 w-24 rounded-full border-4 border-red-100 object-cover" /> :
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-3xl font-bold text-red-500">{profile.name.trim().charAt(0).toUpperCase() || "U"}</div>}
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-gray-900">Profile picture</h2>
            <p className="mt-1 text-sm text-gray-500">Choose a JPG, PNG, or other image (maximum 5 MB).</p>
            <input ref={fileInput} type="file" accept="image/*" onChange={handlePicture} className="mt-3 block w-full max-w-xs text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:font-semibold file:text-red-600 hover:file:bg-red-100" />
            {uploadingPicture && <p className="mt-2 text-sm text-gray-500">Uploading picture...</p>}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl bg-white p-5 shadow-sm sm:p-7">
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Name</label><input name="name" value={profile.name} onChange={handleChange} required maxLength={80} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Email</label><input type="email" value={profile.email} disabled className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500" /><p className="mt-1 text-xs text-gray-400">Email cannot be changed.</p></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Phone</label><input name="phone" value={profile.phone || ""} onChange={handleChange} inputMode="numeric" maxLength={10} className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500" /><p className="mt-1 text-xs text-gray-400">Enter a 10-digit phone number.</p></div>

          <div className="border-t border-gray-100 pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-lg font-semibold text-gray-900">Default delivery address</h2><p className="mt-1 text-sm text-gray-500">Choose which saved address should be selected at checkout.</p></div>
              <button type="button" onClick={() => navigate("/customer/addresses")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Manage addresses</button>
            </div>
            {profile.addresses.length ? (
              <select value={profile.address || profile.addresses.find((item) => item.isDefault)?.address || ""} onChange={(e) => setDefaultAddress(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-red-500">
                {profile.addresses.map((item, index) => <option key={`${item.label}-${index}`} value={item.address}>{item.label || "Address"} — {item.address}</option>)}
              </select>
            ) : <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">No saved addresses yet. Use Manage addresses to add one.</p>}
          </div>

          {message && <p role="status" className={`rounded-lg p-3 text-sm ${messageError ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message}</p>}
          <button type="submit" disabled={saving || uploadingPicture} className="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfile;
