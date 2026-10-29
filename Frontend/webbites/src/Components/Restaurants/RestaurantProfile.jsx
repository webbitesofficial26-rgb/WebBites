import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import apiClient from "../../config/apiClient";
import RestaurantSidebar from "./RestaurantSidebar";

const RestaurantProfile = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
        restaurantName: "",
        ownerName: "",
        email: "",
        phone: "",
        address: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [retryCount, setRetryCount] = useState(0);
    const savingRef = useRef(false);
    const pictureInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const [pictureUploading, setPictureUploading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    localStorage.removeItem("user");
                    navigate("/restaurant/login");
                    return;
                }

                const response = await apiClient.get(
                    "/api/restaurant/profile",
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data?.status === 1 && response.data?.data) {
                    setProfile((current) => ({
                        ...current,
                        ...response.data.data,
                    }));
                    setLoadError("");
                } else {
                    setLoadError(response.data?.message || "Unable to load your restaurant profile.");
                }
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    navigate("/restaurant/login");
                    return;
                }
                setLoadError(error.response?.data?.message || "Unable to load your profile. Please check your connection and try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate, retryCount]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfile((current) => ({ ...current, [name]: value }));
        setFormError("");
        setSuccessMessage("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Prevent rapid repeated submits before React has rendered the saving state.
        if (savingRef.current) return;

        const token = localStorage.getItem("token");
        if (!token) {
            localStorage.removeItem("user");
            navigate("/restaurant/login");
            return;
        }

        const cleanedProfile = {
            restaurantName: String(profile.restaurantName || "").trim(),
            ownerName: String(profile.ownerName || "").trim(),
            phone: String(profile.phone || "").trim(),
            address: String(profile.address || "").trim(),
        };

        if (!Object.values(cleanedProfile).every(Boolean)) {
            setFormError("Please complete all required fields before saving.");
            setSuccessMessage("");
            return;
        }

        // Match the backend's existing phone-number rule before sending the request.
        if (!/^\d{10}$/.test(cleanedProfile.phone)) {
            setFormError("Phone number must contain exactly 10 digits.");
            setSuccessMessage("");
            return;
        }

        try {
            savingRef.current = true;
            setSaving(true);
            setFormError("");
            setSuccessMessage("");

            const response = await apiClient.put(
                "/api/restaurant/profile",
                cleanedProfile,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data?.status === 1) {
                if (response.data?.data) {
                    setProfile((current) => ({ ...current, ...response.data.data }));
                } else {
                    setProfile((current) => ({ ...current, ...cleanedProfile }));
                }
                setSuccessMessage("Profile updated successfully.");
            } else {
                setFormError(response.data?.message || "Your profile could not be updated. Please try again.");
            }
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                navigate("/restaurant/login");
                return;
            }
            setFormError(error.response?.data?.message || "Failed to update profile. Please try again.");
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    const handleProfilePictureUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) { setFormError("Choose an image file."); return; }
        if (file.size > 5 * 1024 * 1024) { setFormError("Image must be 5 MB or smaller."); return; }
        const token = localStorage.getItem("token");
        if (!token) { navigate("/restaurant/login"); return; }
        const formData = new FormData();
        formData.append("image", file);
        setPictureUploading(true); setFormError(""); setSuccessMessage("");
        try {
            const response = await apiClient.put("/api/restaurant/profile-picture", formData, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data?.status === 1) {
                setProfile((current) => ({ ...current, ...response.data.data }));
                try { const stored = JSON.parse(localStorage.getItem("user") || "{}"); localStorage.setItem("user", JSON.stringify({ ...stored, profilePicture: response.data.data.profilePicture })); } catch { /* Ignore stale cache. */ }
                setSuccessMessage("Profile picture updated successfully.");
            } else setFormError(response.data?.message || "Failed to upload profile picture.");
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/restaurant/login"); return; }
            setFormError(error.response?.data?.message || "Failed to upload profile picture. Check Cloudinary configuration.");
        } finally { setPictureUploading(false); }
    };


    const handleCoverImageUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) { setFormError("Choose an image file."); return; }
        if (file.size > 5 * 1024 * 1024) { setFormError("Image must be 5 MB or smaller."); return; }
        const token = localStorage.getItem("token");
        if (!token) { navigate("/restaurant/login"); return; }
        const formData = new FormData();
        formData.append("image", file);
        setCoverUploading(true); setFormError(""); setSuccessMessage("");
        try {
            const response = await apiClient.put("/api/restaurant/cover-image", formData, { headers: { Authorization: `Bearer ${token}` } });
            if (response.data?.status === 1) {
                setProfile((current) => ({ ...current, ...response.data.data }));
                setSuccessMessage("Restaurant cover image updated. Customers will see it on the restaurant listing.");
            } else setFormError(response.data?.message || "Failed to upload cover image.");
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/restaurant/login"); return; }
            setFormError(error.response?.data?.message || "Failed to upload cover image. Check Cloudinary configuration.");
        } finally { setCoverUploading(false); }
    };

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
            if (error.response?.status === 401 || error.response?.status === 403) { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/restaurant/login"); return; }
            setPasswordError(error.response?.data?.message || "Unable to update password.");
        } finally { setPasswordSaving(false); }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/restaurant/login");
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100" role="status" aria-live="polite">
                <p className="text-gray-500">Loading profile...</p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
                <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
                    <h1 className="text-xl font-bold text-gray-900">Profile unavailable</h1>
                    <p className="mt-3 text-sm text-red-600" role="alert">{loadError}</p>
                    <button
                        type="button"
                        onClick={() => { setLoading(true); setLoadError(""); setRetryCount((count) => count + 1); }}
                        className="mt-5 rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">

            {/* Header */}
            <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">

                <Link
                    to="/restaurant"
                    className="text-2xl font-extrabold text-gray-900"
                >
                    Web<span className="text-red-500">Bites</span>
                </Link>

                <div className="flex items-center gap-4">

                    <span className="text-sm text-gray-600">
                        Restaurant Panel
                    </span>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                        Logout
                    </button>

                </div>

            </header>

            <div className="flex">

                {/* Shared restaurant navigation */}
                <RestaurantSidebar />

                {/* Main */}
                <main className="w-full p-6 md:p-8">

                    <div className="mx-auto max-w-3xl">

                        <h1 className="text-3xl font-bold text-gray-900">
                            Restaurant Profile
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Manage your restaurant information.
                        </p>

                        <section className="mt-6 flex flex-wrap items-center gap-5 rounded-xl bg-white p-6 shadow-sm">
                            {profile.profilePicture ? <img src={profile.profilePicture} alt="Restaurant profile" className="h-24 w-24 rounded-full border-4 border-red-100 object-cover" /> : <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-3xl font-bold text-red-500">{String(profile.restaurantName || "R").charAt(0).toUpperCase()}</div>}
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-900">Restaurant profile picture</h2>
                                <p className="mt-1 text-sm text-gray-500">Use a clear logo or restaurant image. JPG, PNG or other image files up to 5 MB.</p>
                                <input ref={pictureInputRef} type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" />
                                <button type="button" onClick={() => pictureInputRef.current?.click()} disabled={pictureUploading} className="mt-3 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">{pictureUploading ? "Uploading..." : profile.profilePicture ? "Change Picture" : "Upload Picture"}</button>
                            </div>
                        </section>

                        <section className="mt-5 rounded-xl bg-white p-6 shadow-sm">
                            <h2 className="font-semibold text-gray-900">Restaurant listing cover image</h2>
                            <p className="mt-1 text-sm text-gray-500">This wide image appears on your restaurant card in the customer-facing restaurant list. Use a landscape photo of your restaurant or food (up to 5 MB).</p>
                            {profile.coverImage ? <img src={profile.coverImage} alt="Restaurant listing cover" className="mt-4 h-48 w-full max-w-2xl rounded-xl object-cover" /> : <div className="mt-4 flex h-40 max-w-2xl items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-500">No cover image uploaded. A default image is currently shown to customers.</div>}
                            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverImageUpload} className="hidden" />
                            <button type="button" onClick={() => coverInputRef.current?.click()} disabled={coverUploading} className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">{coverUploading ? "Uploading..." : profile.coverImage ? "Change Cover Image" : "Upload Cover Image"}</button>
                        </section>

                        <form
                            onSubmit={handleSubmit}
                            className="mt-8 rounded-xl bg-white p-6 shadow-sm"
                        >
                            {formError && (
                                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                                    {formError}
                                </div>
                            )}
                            {successMessage && (
                                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700" role="status" aria-live="polite">
                                    {successMessage}
                                </div>
                            )}

                            {/* Restaurant Name */}
                            <div>
                                <label htmlFor="restaurantName" className="text-sm font-medium text-gray-700">
                                    Restaurant Name
                                </label>

                                <input
                                    id="restaurantName"
                                    type="text"
                                    name="restaurantName"
                                    value={profile.restaurantName}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                                    required
                                    disabled={saving}
                                    autoComplete="organization"
                                />
                            </div>

                            {/* Owner Name */}
                            <div className="mt-5">
                                <label htmlFor="ownerName" className="text-sm font-medium text-gray-700">
                                    Owner Name
                                </label>

                                <input
                                    id="ownerName"
                                    type="text"
                                    name="ownerName"
                                    value={profile.ownerName}
                                    onChange={handleChange}
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                                    required
                                    disabled={saving}
                                    autoComplete="name"
                                />
                            </div>

                            {/* Email */}
                            <div className="mt-5">
                                <label htmlFor="profileEmail" className="text-sm font-medium text-gray-700">
                                    Email
                                </label>

                                <input
                                    id="profileEmail"
                                    type="email"
                                    value={profile.email}
                                    disabled
                                    className="mt-2 w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-500"
                                />

                                <p className="mt-1 text-xs text-gray-400">
                                    Email cannot be changed here.
                                </p>
                            </div>

                            {/* Phone */}
                            <div className="mt-5">
                                <label htmlFor="profilePhone" className="text-sm font-medium text-gray-700">
                                    Phone
                                </label>

                                <input
                                    id="profilePhone"
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    maxLength={10}
                                    pattern="[0-9]{10}"
                                    title="Enter a 10-digit phone number."
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                                    required
                                    disabled={saving}
                                    autoComplete="tel"
                                />
                            </div>

                            {/* Address */}
                            <div className="mt-5">
                                <label htmlFor="profileAddress" className="text-sm font-medium text-gray-700">
                                    Address
                                </label>

                                <textarea
                                    id="profileAddress"
                                    name="address"
                                    value={profile.address}
                                    onChange={handleChange}
                                    rows="4"
                                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-red-500"
                                    required
                                    disabled={saving}
                                    autoComplete="street-address"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="mt-7 flex gap-3">

                                <Link
                                    to="/restaurant"
                                    className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </Link>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : "Save Changes"}
                                </button>

                            </div>

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

export default RestaurantProfile;
