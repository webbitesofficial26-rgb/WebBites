import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

const emptyForm = {
  name: "", description: "", discountType: "percentage", discountValue: "50",
  maxDiscount: "250", minOrderAmount: "299", startDate: "", expiryDate: "",
};

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const describeOffer = (offer) => {
  if (offer.discountType === "free_delivery") return "Free delivery";
  if (offer.discountType === "percentage") return `${offer.discountValue}% OFF${offer.maxDiscount != null ? ` up to ${money(offer.maxDiscount)}` : ""}`;
  return `${money(offer.discountValue)} OFF`;
};

const ManageOfferTemplates = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await apiClient.get("/api/admin/offer-templates", { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.status === 1) setOffers(response.data.data || []);
      } catch (fetchError) {
        if (fetchError.response?.status === 401) navigate("/admin/login");
        else setError(fetchError.response?.data?.message || "Unable to load offer templates.");
      } finally { setLoading(false); }
    };
    fetchOffers();
  }, [navigate]);

  const reloadOffers = async () => {
    const token = localStorage.getItem("token");
    const response = await apiClient.get("/api/admin/offer-templates", { headers: { Authorization: `Bearer ${token}` } });
    if (response.data.status === 1) setOffers(response.data.data || []);
  };

  const change = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value,
      ...(name === "discountType" && value === "free_delivery" ? { discountValue: "0", maxDiscount: "" } : {}),
      ...(name === "discountType" && value === "fixed" ? { maxDiscount: "" } : {}),
      ...(name === "discountType" && value === "percentage" ? { discountValue: "50", maxDiscount: "250" } : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault(); setError(""); setNotice("");
    if (!form.name.trim() || !form.expiryDate) { setError("Enter an offer name and expiry date."); return; }
    const discountValue = Number(form.discountValue);
    const minOrderAmount = Number(form.minOrderAmount);
    const maxDiscount = form.maxDiscount.trim() ? Number(form.maxDiscount) : null;
    if (!Number.isFinite(minOrderAmount) || minOrderAmount < 0 ||
      (form.discountType !== "free_delivery" && (!Number.isFinite(discountValue) || discountValue <= 0)) ||
      (form.discountType === "percentage" && discountValue > 100) ||
      (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount < 0))) {
      setError("Check the discount, maximum discount, and minimum order amounts."); return;
    }
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const payload = { name: form.name.trim(), description: form.description.trim(), discountType: form.discountType,
        discountValue: form.discountType === "free_delivery" ? 0 : discountValue, minOrderAmount, maxDiscount,
        startDate: form.startDate ? new Date(form.startDate).toISOString() : new Date().toISOString(),
        expiryDate: new Date(form.expiryDate).toISOString() };
      const response = await apiClient.post("/api/admin/offer-templates", payload, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === 1) {
        setNotice("Offer template created. Restaurants will be able to activate it in the next stage.");
        setForm(emptyForm); await reloadOffers();
      }
    } catch (submitError) { setError(submitError.response?.data?.message || "Unable to create offer template."); }
    finally { setSaving(false); }
  };

  const toggle = async (offerId) => {
    setError(""); setNotice("");
    try {
      const token = localStorage.getItem("token");
      const response = await apiClient.patch(`/api/admin/offer-templates/${offerId}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.status === 1) { setNotice(response.data.message); await reloadOffers(); }
    } catch (toggleError) { setError(toggleError.response?.data?.message || "Unable to update this template."); }
  };

  const inputClass = "w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-red-500";
  return <div className="min-h-screen bg-gray-100"><AdminHeader /><div className="flex"><AdminSidebar />
    <main className="w-full min-w-0 p-6 md:p-8">
      <div className="mb-8"><h1 className="text-3xl font-bold text-gray-900">Offer Templates</h1><p className="mt-2 text-gray-500">Create reusable promotions that restaurants can choose to activate.</p></div>
      {error && <div role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-700">{notice}</div>}
      <form onSubmit={submit} className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Create offer template</h2>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-sm font-medium">Offer name<input className={`${inputClass} mt-2`} name="name" value={form.name} onChange={change} maxLength={80} placeholder="Mega Deal" required /></label>
          <label className="text-sm font-medium">Description<input className={`${inputClass} mt-2`} name="description" value={form.description} onChange={change} maxLength={300} placeholder="Save on your favourite meals" /></label>
          <label className="text-sm font-medium">Discount type<select className={`${inputClass} mt-2`} name="discountType" value={form.discountType} onChange={change}><option value="percentage">Percentage discount</option><option value="fixed">Fixed amount discount</option><option value="free_delivery">Free delivery</option></select></label>
          {form.discountType !== "free_delivery" && <label className="text-sm font-medium">Discount value {form.discountType === "percentage" ? "(%)" : "(₹)"}<input className={`${inputClass} mt-2`} type="number" name="discountValue" min="1" max={form.discountType === "percentage" ? 100 : undefined} value={form.discountValue} onChange={change} required /></label>}
          {form.discountType === "percentage" && <label className="text-sm font-medium">Maximum discount (₹)<input className={`${inputClass} mt-2`} type="number" name="maxDiscount" min="0" value={form.maxDiscount} onChange={change} placeholder="250" /></label>}
          <label className="text-sm font-medium">Minimum order (₹)<input className={`${inputClass} mt-2`} type="number" name="minOrderAmount" min="0" value={form.minOrderAmount} onChange={change} required /></label>
          <label className="text-sm font-medium">Starts at (optional)<input className={`${inputClass} mt-2`} type="datetime-local" name="startDate" value={form.startDate} onChange={change} /></label>
          <label className="text-sm font-medium">Expires at<input className={`${inputClass} mt-2`} type="datetime-local" name="expiryDate" value={form.expiryDate} onChange={change} required /></label>
        </div>
        <button disabled={saving} className="mt-6 rounded-lg bg-red-500 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-60">{saving ? "Creating..." : "Create Offer Template"}</button>
      </form>
      <section className="mt-8 rounded-xl bg-white p-6 shadow-sm"><h2 className="text-xl font-semibold">Created templates</h2>
        {loading ? <p className="py-8 text-gray-500">Loading offer templates...</p> : offers.length === 0 ? <p className="py-8 text-gray-500">No offer templates created yet.</p> :
          <div className="mt-5 grid gap-4 lg:grid-cols-2">{offers.map((offer) => <article key={offer._id} className="rounded-xl border border-gray-200 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{offer.name}</h3><p className="mt-1 font-semibold text-red-500">{describeOffer(offer)}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${offer.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{offer.isActive ? "Active template" : "Inactive template"}</span></div>
            {offer.description && <p className="mt-3 text-sm text-gray-600">{offer.description}</p>}
            <p className="mt-3 text-sm text-gray-600">Minimum order: {money(offer.minOrderAmount)}</p>
            <p className="mt-1 text-sm text-gray-600">Valid until: {new Date(offer.expiryDate).toLocaleString()}</p>
            <p className="mt-2 text-xs text-gray-500">Restaurant participation will be managed separately; this status controls whether the template is available for selection.</p>
            <button onClick={() => toggle(offer._id)} className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">{offer.isActive ? "Deactivate template" : "Activate template"}</button>
          </article>)}</div>}
      </section>
    </main></div></div>;
};
export default ManageOfferTemplates;
