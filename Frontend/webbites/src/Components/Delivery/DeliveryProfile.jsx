import { useEffect, useRef, useState } from "react";
import apiClient from "../../config/apiClient";
import DeliverySidebar from "./DeliverySidebar";
import DeliveryHeader from "./DeliveryHeader";

const DeliveryProfile = () => {
  const [profile, setProfile] = useState({
    deliveryName: "",
    email: "",
    phone: "",
    address: "",
  });

  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const pictureInputRef = useRef(null);
  const [pictureUploading, setPictureUploading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await apiClient.get(
          "/api/delivery/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.status === 1) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error(error);
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.replace("/delivery/login");
          return;
        }
        setLoadError(error.response?.data?.message || "Unable to load your profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = async (event) => {
    event.preventDefault(); setPasswordMessage(""); setPasswordError("");
    if (passwordForm.newPassword.length < 8) { setPasswordError("New password must contain at least 8 characters."); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { setPasswordError("New password and confirmation do not match."); return; }
    setPasswordSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.put("/api/account-password/change", passwordForm, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data?.status === 1) { setPasswordMessage(response.data.message); setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
      else setPasswordError(response.data?.message || "Unable to update password.");
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.replace("/delivery/login"); return; }
      setPasswordError(error.response?.data?.message || "Unable to update password.");
    } finally { setPasswordSaving(false); }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setMessageError(true); setMessage("Choose an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { setMessageError(true); setMessage("Image must be 5 MB or smaller."); return; }
    const token = localStorage.getItem("token");
    if (!token) { window.location.replace("/delivery/login"); return; }
    const formData = new FormData();
    formData.append("image", file);
    setPictureUploading(true); setMessage(""); setMessageError(false);
    try {
      const response = await apiClient.put("/api/delivery/profile-picture", formData, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data?.status === 1) {
        setProfile((current) => ({ ...current, ...response.data.data }));
        try { const stored = JSON.parse(localStorage.getItem("user") || "{}"); localStorage.setItem("user", JSON.stringify({ ...stored, profilePicture: response.data.data.profilePicture })); } catch { /* Ignore stale cache. */ }
        setMessage("Profile picture updated successfully.");
      } else { setMessageError(true); setMessage(response.data?.message || "Failed to upload profile picture."); }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); window.location.replace("/delivery/login"); return; }
      setMessageError(true); setMessage(error.response?.data?.message || "Failed to upload profile picture. Check Cloudinary configuration.");
    } finally { setPictureUploading(false); }
  };

  const handleChange = (e) => {
    setMessage("");
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageError(false);

    const cleanName = profile.deliveryName.trim();
    const cleanPhone = profile.phone.trim();
    const cleanAddress = profile.address.trim();

    if (!cleanName || !cleanAddress || !/^\d{10}$/.test(cleanPhone)) {
      setMessageError(true);
      setMessage("Enter a name and address, and a phone number containing exactly 10 digits.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");

      const response = await apiClient.put(
        "/api/delivery/profile",
        {
          deliveryName: cleanName,
          phone: cleanPhone,
          address: cleanAddress,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.status === 1) {
        setProfile(response.data.data);
        setMessage("Profile updated successfully.");
        setMessageError(false);

        let oldUser = {};
        try {
          const storedUser = localStorage.getItem("user");
          oldUser = storedUser ? JSON.parse(storedUser) : {};
        } catch (error) {
          // The server update succeeded; recover from a malformed local cache.
          localStorage.removeItem("user");
        }

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...oldUser,
            ...response.data.data,
          })
        );
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.replace("/delivery/login");
        return;
      }
      setMessageError(true);
      setMessage(error.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        <DeliveryHeader title="My Profile" subtitle="Delivery partner account" />
        <div className="flex flex-1 flex-col md:flex-row">
          <DeliverySidebar />
          <main className="flex flex-1 items-center justify-center px-4 py-10">
            <p className="text-gray-500">Loading profile...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <DeliveryHeader title="My Profile" subtitle="Account details and password settings" />
      <div className="flex flex-1 flex-col md:flex-row">
        <DeliverySidebar />
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 md:py-10">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-8 shadow">

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          My Profile
        </h1>

        <p className="mb-6 text-gray-500">
          Manage your delivery partner information
        </p>

        <section className="mb-6 flex flex-wrap items-center gap-5 rounded-xl border border-gray-100 p-5">
          {profile.profilePicture ? <img src={profile.profilePicture} alt="Delivery profile" className="h-24 w-24 rounded-full border-4 border-red-100 object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-500">{String(profile.deliveryName || "D").charAt(0).toUpperCase()}</div>}
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">Profile picture</h2>
            <p className="mt-1 text-sm text-gray-500">Upload a clear photo. Image files up to 5 MB.</p>
            <input ref={pictureInputRef} type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
            <button type="button" onClick={() => pictureInputRef.current?.click()} disabled={pictureUploading} className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{pictureUploading ? "Uploading..." : profile.profilePicture ? "Change Picture" : "Upload Picture"}</button>
          </div>
        </section>

        {loadError && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700" role="alert">
            <span>{loadError}</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {message && (
          <div className={`mb-5 rounded-lg border px-4 py-3 ${messageError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"}`} role={messageError ? "alert" : "status"}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Name
            </label>

            <input
              type="text"
              name="deliveryName"
              value={profile.deliveryName || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Email
            </label>

            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Phone
            </label>

            <input
              type="text"
              name="phone"
              value={profile.phone || ""}
              inputMode="numeric"
              maxLength={10}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-gray-700">
              Address
            </label>

            <textarea
              name="address"
              value={profile.address || ""}
              onChange={handleChange}
              rows="4"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={saving || Boolean(loadError)}
            className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Update Profile"}
          </button>

        </form>

        <section className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-lg font-bold text-gray-900">Reset Password</h2>
          <p className="mt-1 text-sm text-gray-500">Change your password using your current password.</p>
          {passwordMessage && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{passwordMessage}</p>}
          {passwordError && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{passwordError}</p>}
          <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
            {[['currentPassword','Current password'],['newPassword','New password'],['confirmPassword','Confirm new password']].map(([name,label]) => <label key={name} className="block text-sm font-medium text-gray-700">{label}<input type="password" name={name} value={passwordForm[name]} onChange={(e) => setPasswordForm((current) => ({ ...current, [name]: e.target.value }))} minLength={name === 'currentPassword' ? undefined : 8} autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'} required className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-red-500" /></label>)}
            <button type="submit" disabled={passwordSaving} className="rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60">{passwordSaving ? "Updating..." : "Update Password"}</button>
          </form>
        </section>
      </div>
        </main>
      </div>
    </div>
  );
};

export default DeliveryProfile;