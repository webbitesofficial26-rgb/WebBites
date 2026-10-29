import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";

const blankAddress = () => ({ label: "Home", address: "", isDefault: false });

const CustomerAddresses = () => {
  const navigate = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(false);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await apiClient.get("/api/customer/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (response.data.status === 1) {
          const data = response.data.data || {};
          const saved = Array.isArray(data.addresses) && data.addresses.length
            ? data.addresses
            : data.address?.trim() ? [{ label: "Home", address: data.address, isDefault: true }] : [];
          setAddresses(saved.map((item) => ({ label: item.label || "Home", address: item.address || "", isDefault: Boolean(item.isDefault) })));
        }
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        } else {
          setMessage(error.response?.data?.message || "Unable to load saved addresses.");
          setErrorMessage(true);
        }
      } finally { setLoading(false); }
    };
    fetchAddresses();
  }, [navigate]);

  const updateAddress = (index, field, value) => setAddresses((current) => current.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const addAddress = () => {
    if (addresses.length >= 20) { setMessage("You can save up to 20 addresses."); setErrorMessage(true); return; }
    setAddresses((current) => [...current, { ...blankAddress(), isDefault: current.length === 0 }]);
    setMessage("");
  };
  const removeAddress = (index) => setAddresses((current) => {
    const next = current.filter((_, i) => i !== index);
    if (next.length && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true };
    return next;
  });
  const setDefault = (index) => setAddresses((current) => current.map((item, i) => ({ ...item, isDefault: i === index })));

  const saveAddresses = async (event) => {
    event.preventDefault();
    if (!addresses.length) { setMessage("Add at least one delivery address."); setErrorMessage(true); return; }
    if (addresses.some((item) => !item.address.trim())) { setMessage("Fill in each address or remove the empty address."); setErrorMessage(true); return; }
    const defaultAddress = addresses.find((item) => item.isDefault) || addresses[0];
    const normalized = addresses.map((item, index) => ({ label: item.label, address: item.address.trim(), isDefault: item.address === defaultAddress.address && index === addresses.indexOf(defaultAddress) }));
    try {
      setSaving(true); setMessage("");
      const response = await apiClient.put("/api/customer/profile", {
        addresses: normalized,
        address: defaultAddress.address.trim(),
      }, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
      if (response.data.status === 1) {
        const data = response.data.data || {};
        setAddresses(data.addresses || normalized);
        setMessage("Saved addresses updated successfully."); setErrorMessage(false);
      } else {
        setMessage(response.data.message || "Unable to save addresses."); setErrorMessage(true);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save addresses."); setErrorMessage(true);
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-gray-500">Loading saved addresses...</div>;

  return <main className="min-h-screen bg-gray-100 px-4 py-8 sm:p-6"><div className="mx-auto max-w-3xl">
    <button type="button" onClick={() => navigate("/")} className="mb-4 text-sm font-medium text-red-500 hover:text-red-600">← Back to Home</button>
    <div className="mb-6"><h1 className="text-3xl font-bold text-gray-900">Manage Addresses</h1><p className="mt-2 text-gray-500">Add, edit, or remove your delivery addresses and choose a default.</p></div>
    <form onSubmit={saveAddresses} className="space-y-4 rounded-xl bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold text-gray-900">Saved delivery addresses</h2><button type="button" onClick={addAddress} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">+ Add address</button></div>
      {!addresses.length && <p className="rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">No saved addresses yet. Add one to make checkout easier.</p>}
      {addresses.map((item, index) => <section key={index} className="rounded-lg border border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold text-gray-800">Address {index + 1}</h3><button type="button" onClick={() => removeAddress(index)} className="text-sm font-medium text-red-500 hover:text-red-700">Remove</button></div>
        <label className="mb-1 block text-xs font-medium text-gray-500">Label</label><select value={item.label} onChange={(e) => updateAddress(index, "label", e.target.value)} className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5"><option>Home</option><option>Work</option><option>Other</option></select>
        <label className="mb-1 block text-xs font-medium text-gray-500">Full address</label><textarea value={item.address} onChange={(e) => updateAddress(index, "address", e.target.value)} rows={3} maxLength={300} placeholder="House/flat, street, area, city, state, PIN code" className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-red-500" />
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700"><input type="radio" name="defaultAddress" checked={item.isDefault} onChange={() => setDefault(index)} className="accent-red-500" /> Default delivery address</label>
      </section>)}
      {message && <p role="status" className={`rounded-lg p-3 text-sm ${errorMessage ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>{message}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-lg bg-red-500 px-4 py-3 font-semibold text-white hover:bg-red-600 disabled:opacity-60">{saving ? "Saving..." : "Save Addresses"}</button>
    </form>
  </div></main>;
};

export default CustomerAddresses;
