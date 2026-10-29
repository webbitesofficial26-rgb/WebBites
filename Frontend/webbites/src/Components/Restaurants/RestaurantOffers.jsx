import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import RestaurantSidebar from "./RestaurantSidebar";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const describeOffer = (offer) => {
  if (offer.discountType === "free_delivery") return "Free delivery";
  if (offer.discountType === "percentage") return `${offer.discountValue}% OFF${offer.maxDiscount != null ? ` up to ${money(offer.maxDiscount)}` : ""}`;
  return `${money(offer.discountValue)} OFF`;
};

const RestaurantOffers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await apiClient.get("/api/restaurant/offers", { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.status === 1) setOffers(response.data.data || []);
        else setError(response.data.message || "Unable to load offers.");
      } catch (fetchError) {
        if (fetchError.response?.status === 401 || fetchError.response?.status === 403) navigate("/restaurant/login");
        else setError(fetchError.response?.data?.message || "Unable to load offers.");
      } finally { setLoading(false); }
    };
    fetchOffers();
  }, [navigate]);

  const toggleOffer = async (offer) => {
    setBusyId(offer._id); setError(""); setNotice("");
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.patch(`/api/restaurant/offers/${offer._id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === 1) {
        setNotice(response.data.message);
        setOffers((current) => current.map((item) => ({
          ...item,
          isParticipating: item._id === offer._id ? !offer.isParticipating :
            (offer.discountType === "free_delivery" ? item.discountType !== "free_delivery" && item.isParticipating : item.discountType === "free_delivery" && item.isParticipating),
        })));
        // Reload from the server so any offer automatically replaced by this one is reflected accurately.
        const refreshed = await apiClient.get("/api/restaurant/offers", { headers: { Authorization: `Bearer ${token}` } });
        if (refreshed.data.status === 1) setOffers(refreshed.data.data || []);
      }
    } catch (toggleError) { setError(toggleError.response?.data?.message || "Unable to update this offer."); }
    finally { setBusyId(""); }
  };

  return <div className="min-h-screen bg-gray-100">
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
      <a href="/restaurant" className="text-2xl font-extrabold text-gray-900">Web<span className="text-red-500">Bites</span></a>
      <div className="flex items-center gap-4"><span className="hidden text-sm text-gray-600 sm:inline">Restaurant Panel</span><button type="button" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("user"); navigate("/login"); }} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Logout</button></div>
    </header>
    <div className="flex"><RestaurantSidebar /><main className="w-full min-w-0 p-6 md:p-8">
    <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900">Offers & Promotions</h1><p className="mt-2 text-gray-600">Choose offers created by WebBites admin to promote your restaurant.</p></div>
    {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{notice}</div>}
    <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">You can have one active discount offer and one separate free-delivery offer at a time. Activating another offer of the same type replaces your current selection.</div>
    {loading ? <div className="rounded-xl bg-white p-8 text-gray-500">Loading available offers...</div> : offers.length === 0 ? <div className="rounded-xl bg-white p-8 text-gray-500">No active offers are available right now. Please check back later.</div> :
      <div className="grid gap-5 lg:grid-cols-2">{offers.map((offer) => <article key={offer._id} className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-gray-900">{offer.name}</h2><p className="mt-2 text-lg font-bold text-red-500">{describeOffer(offer)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${offer.isParticipating ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{offer.isParticipating ? "Active for your restaurant" : "Not participating"}</span></div>
        {offer.description && <p className="mt-3 text-sm text-gray-600">{offer.description}</p>}
        <p className="mt-3 text-sm text-gray-600">Minimum order: {money(offer.minOrderAmount)}</p>
        <p className="mt-1 text-sm text-gray-600">Expires: {new Date(offer.expiryDate).toLocaleString()}</p>
        <button onClick={() => toggleOffer(offer)} disabled={busyId === offer._id} className={`mt-5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${offer.isParticipating ? "bg-gray-700 hover:bg-gray-800" : "bg-red-500 hover:bg-red-600"}`}>{busyId === offer._id ? "Updating..." : offer.isParticipating ? "Deactivate Offer" : "Activate Offer"}</button>
      </article>)}</div>}
  </main></div></div>;
};
export default RestaurantOffers;
