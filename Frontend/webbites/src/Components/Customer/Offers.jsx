import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import apiClient from "../../config/apiClient";


const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [restaurantOffers, setRestaurantOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copyFeedback, setCopyFeedback] = useState({});
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const [couponResponse, restaurantResponse] = await Promise.all([
          apiClient.get("/api/coupons/available"),
          apiClient.get("/api/restaurant-offers/available"),
        ]);
        setOffers(couponResponse.data?.status === 1 && Array.isArray(couponResponse.data.data) ? couponResponse.data.data : []);
        setRestaurantOffers(restaurantResponse.data?.status === 1 && Array.isArray(restaurantResponse.data.data) ? restaurantResponse.data.data : []);
        if (couponResponse.data?.status !== 1 && restaurantResponse.data?.status !== 1) setError("Unable to load offers right now.");
      } catch (fetchError) {
        console.error("Fetch offers error:", fetchError);
        setError(fetchError.response?.data?.message || "Unable to load offers right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [retryKey]);

  const getOfferTitle = (offer) => {
    if (offer.discountType === "percentage") return `${offer.discountValue}% OFF`;
    if (offer.discountType === "free_delivery") return "FREE DELIVERY";
    return `₹${offer.discountValue} OFF`;
  };

  const handleCopyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopyFeedback((current) => ({ ...current, [code]: "Copied!" }));
    } catch (copyError) {
      console.error("Copy coupon code error:", copyError);
      setCopyFeedback((current) => ({ ...current, [code]: "Copy failed. Please copy the code manually." }));
    }
  };

  const getOfferCondition = (offer) => {
    const conditions = [];
    if (Number(offer.minOrderAmount) > 0) {
      conditions.push(`Minimum order value ₹${offer.minOrderAmount}`);
    }
    if (offer.discountType === "percentage" && offer.maxDiscount != null) {
      conditions.push(`Maximum discount ₹${offer.maxDiscount}`);
    }
    return conditions.length ? conditions.join(" · ") : "No minimum order stated";
  };

  const getExpiryLabel = (expiryDate) => {
    if (!expiryDate) return "Check eligibility at checkout";
    const parsedDate = new Date(expiryDate);
    if (Number.isNaN(parsedDate.getTime())) return "Check eligibility at checkout";
    return `Valid until ${parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">

      <Header />

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">

          <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
            WebBites Offers
          </p>

          <h1 className="mt-2 text-4xl font-extrabold text-gray-900 md:text-5xl">
            Delicious deals,
            <span className="text-red-500"> just for you.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-gray-500">
            Save more on your favourite food with our latest offers and
            discount codes.
          </p>

        </div>
      </section>

      {/* Offers */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

        {loading ? (
          <p className="rounded-xl bg-white p-8 text-center text-gray-500" role="status">Loading available offers...</p>
        ) : error ? (
          <div className="rounded-xl bg-white p-8 text-center" role="alert">
            <p className="text-red-600">{error}</p>
            <p className="mt-2 text-sm text-gray-500">Please try again or check the offers at checkout.</p>
            <button
              type="button"
              onClick={() => {
                setError("");
                setLoading(true);
                setRetryKey((current) => current + 1);
              }}
              className="mt-4 rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
            >
              Try Again
            </button>
          </div>
        ) : (
        <div>
        <h2 className="mb-5 text-2xl font-bold text-gray-900">WebBites Coupon Codes</h2>
        {offers.length === 0 ? <p className="mb-8 rounded-xl bg-white p-6 text-gray-500">No active coupon codes right now.</p> : <div className="grid gap-6 md:grid-cols-2">

          {offers.map((offer) => (
            <div
              key={offer.code}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >

              <div className="flex flex-col justify-between gap-6 p-7 sm:flex-row">

                <div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                      SPECIAL OFFER
                    </span>
                  </div>

                  <h2 className="mt-4 text-4xl font-extrabold text-red-500">
                    {getOfferTitle(offer)}
                  </h2>

                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {offer.description || (offer.discountType === "percentage"
                      ? `Save ${offer.discountValue}% on your order.`
                      : `Save ₹${offer.discountValue} on your order.`)}
                  </p>

                  <p className="mt-3 text-xs text-gray-500">
                    {getOfferCondition(offer)}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {getExpiryLabel(offer.expiryDate)}
                  </p>

                  {/* Coupon Code */}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-3 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
                      <span className="text-xs font-semibold text-gray-500">
                        CODE
                      </span>
                      <span className="font-bold text-gray-900">
                        {offer.code}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(offer.code)}
                      className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-300"
                      aria-label={`Copy coupon code ${offer.code}`}
                    >
                      {copyFeedback[offer.code] === "Copied!" ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                  {copyFeedback[offer.code] && (
                    <p className={`mt-2 text-sm ${copyFeedback[offer.code] === "Copied!" ? "text-green-600" : "text-red-600"}`} role="status">
                      {copyFeedback[offer.code]}
                    </p>
                  )}

                </div>

                <div className="flex items-end sm:items-center">

                  <Link
                    to="/cust-viewrestaurant"
                    onClick={() => { sessionStorage.removeItem("webbites_pending_restaurant_offer"); sessionStorage.setItem("webbites_pending_coupon", offer.code); }}
                    className="w-full rounded-xl bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-red-500 sm:w-auto"
                  >
                    Order Now
                  </Link>

                </div>

              </div>

            </div>
          ))}

        </div>}

        <section className="mt-12">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">Restaurant Offers</h2>
          <p className="mb-6 text-gray-500">Exclusive deals from restaurants participating in WebBites offers.</p>
          {restaurantOffers.length === 0 ? <p className="rounded-xl bg-white p-6 text-gray-500">No restaurant offers are active right now.</p> : <div className="grid gap-6 md:grid-cols-2">
            {restaurantOffers.map((offer) => (
              <article key={offer.restaurantOfferId} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-lg">
                {offer.coverImage && <img src={offer.coverImage} alt={`${offer.restaurantName} cover`} className="h-44 w-full object-cover" loading="lazy" />}
                <div className="p-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-red-500">{offer.restaurantName}</p>
                  <h3 className="mt-2 text-2xl font-extrabold text-gray-900">{offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : offer.discountType === "free_delivery" ? "FREE DELIVERY" : `₹${offer.discountValue} OFF`}</h3>
                  <p className="mt-2 font-semibold text-gray-800">{offer.offerName}</p>
                  {offer.description && <p className="mt-1 text-sm text-gray-500">{offer.description}</p>}
                  <p className="mt-3 text-xs text-gray-500">Minimum order ₹{Number(offer.minOrderAmount || 0)}{offer.discountType === "percentage" && offer.maxDiscount != null ? ` · Maximum discount ₹${offer.maxDiscount}` : ""}</p>
                  <p className="mt-1 text-xs text-gray-400">{getExpiryLabel(offer.expiryDate)}</p>
                  <Link to="/cust-viewrestaurant" onClick={() => { sessionStorage.removeItem("webbites_pending_coupon"); sessionStorage.setItem("webbites_pending_restaurant_offer", JSON.stringify(offer)); }} className="mt-5 inline-flex rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500">View Restaurant</Link>
                </div>
              </article>
            ))}
          </div>}
        </section>
        </div>
        )}

        {/* Bottom Information */}
        <div className="mt-10 rounded-2xl bg-red-50 p-6">

          <h2 className="font-bold text-gray-900">
            How to use an offer
          </h2>

          <div className="mt-4 grid gap-4 text-sm text-gray-600 md:grid-cols-3">

            <div>
              <span className="font-bold text-red-500">1.</span>{" "}
              Choose your favourite restaurant.
            </div>

            <div>
              <span className="font-bold text-red-500">2.</span>{" "}
              Add your favourite food to the cart.
            </div>

            <div>
              <span className="font-bold text-red-500">3.</span>{" "}
              Apply the coupon code at checkout.
            </div>

          </div>

        </div>

      </main>

      <Footer />

    </div>
  );
};

export default Offers;