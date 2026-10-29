import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../config/apiClient";
import { useCart } from "../Context/CartContext";

const Checkout = () => {
    const {
        cart,
        cartTotal,
        clearCart,
    } = useCart();

    const navigate = useNavigate();

    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [savedAddress, setSavedAddress] = useState("");
    const [savedAddressLabel, setSavedAddressLabel] = useState("default");
    const [profileAddressLoading, setProfileAddressLoading] = useState(true);
    const [addressMessage, setAddressMessage] = useState("");
    const [addressError, setAddressError] = useState("");
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [checkoutMessage, setCheckoutMessage] = useState("");
    const [checkoutMessageType, setCheckoutMessageType] = useState("error");

    // Load the customer's saved profile address and use it as a checkout
    // convenience without preventing the customer from editing it.
    useEffect(() => {
        const fetchSavedAddress = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;

                const response = await apiClient.get("/api/customer/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const profile = response.data?.status === 1 ? response.data.data : null;
                const savedAddresses = Array.isArray(profile?.addresses) ? profile.addresses : [];
                const defaultAddress = savedAddresses.find((item) => item?.isDefault && String(item.address || "").trim())
                    || savedAddresses.find((item) => String(item.address || "").trim());
                const address = String(defaultAddress?.address || profile?.address || "").trim();
                const addressLabel = String(defaultAddress?.label || "default").trim();

                setSavedAddress(address);
                setSavedAddressLabel(addressLabel);
                if (address) {
                    setDeliveryAddress((currentAddress) =>
                        currentAddress.trim() ? currentAddress : address
                    );
                }
            } catch (error) {
                // Checkout remains usable if profile details cannot be loaded.
                console.error("Unable to load saved delivery address:", error);
            } finally {
                setProfileAddressLoading(false);
            }
        };

        fetchSavedAddress();
    }, []);

    const useSavedAddress = () => {
        if (!savedAddress) return;
        setDeliveryAddress(savedAddress);
        setAddressError("");
        setAddressMessage("Default delivery address added to checkout.");
    };

    // Coupon states
    const [couponInput, setCouponInput] = useState(() => {
        const pendingCode = sessionStorage.getItem("webbites_pending_coupon") || "";
        if (pendingCode) sessionStorage.removeItem("webbites_pending_coupon");
        return pendingCode.toUpperCase();
    });
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponMessage, setCouponMessage] = useState("");
    const [couponMessageType, setCouponMessageType] = useState("");
    const [restaurantOffer, setRestaurantOffer] = useState(() => {
        try {
            const raw = sessionStorage.getItem("webbites_pending_restaurant_offer");
            if (raw) sessionStorage.removeItem("webbites_pending_restaurant_offer");
            return raw ? JSON.parse(raw) : null;
        } catch { return null; }
    });
    const offerMatchesCart = Boolean(restaurantOffer && cart.length && String(restaurantOffer.restaurantId) === String(cart[0].restaurantId));

    // Apply coupon
    const handleApplyCoupon = async () => {
        const code = couponInput.trim().toUpperCase();

        if (restaurantOffer) {
            setCouponMessage("Remove the restaurant offer before applying a coupon.");
            setCouponMessageType("error");
            return;
        }
        if (!code) {
            setCouponMessage("Please enter a coupon code.");
            setCouponMessageType("error");
            return;
        }

        if (cart.length === 0) {
            setCouponMessage("Your cart is empty.");
            setCouponMessageType("error");
            return;
        }

        try {
            setCouponLoading(true);
            setCouponMessage("");
            setCouponMessageType("");

            const token = localStorage.getItem("token");

            if (!token) {
                alert("Please login to apply a coupon.");
                navigate("/login");
                return;
            }

            const response = await apiClient.post(
                "/api/coupons/validate",
                {
                    code,
                    orderAmount: cartTotal,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.data.status === 1) {
                setAppliedCoupon(response.data.data);
                setCouponInput(response.data.data.code);

                setCouponMessage(
                    response.data.message || "Coupon applied successfully!"
                );
                setCouponMessageType("success");
            } else {
                setAppliedCoupon(null);
                setCouponMessage(
                    response.data.message || "Unable to apply coupon."
                );
                setCouponMessageType("error");
            }
        } catch (error) {
            setAppliedCoupon(null);
            setCouponMessage(
                error.response?.data?.message ||
                "Unable to validate coupon. Please try again."
            );
            setCouponMessageType("error");
        } finally {
            setCouponLoading(false);
        }
    };

    // Remove coupon
    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponInput("");
        setCouponMessage("Coupon removed.");
        setCouponMessageType("success");
    };

    const handleRemoveRestaurantOffer = () => {
        setRestaurantOffer(null);
        setCouponMessage("Restaurant offer removed.");
        setCouponMessageType("success");
    };

    // Preview values are for display only.
    // The backend recalculates the discount before creating an order.
    const couponDiscountAmount = appliedCoupon
        ? Number(appliedCoupon.discount) || 0
        : 0;
    const restaurantOfferDiscountAmount = offerMatchesCart && restaurantOffer && cartTotal >= Number(restaurantOffer.minOrderAmount || 0)
        ? restaurantOffer.discountType === "percentage"
            ? Math.min(cartTotal * Number(restaurantOffer.discountValue || 0) / 100, restaurantOffer.maxDiscount == null ? Number.POSITIVE_INFINITY : Number(restaurantOffer.maxDiscount))
            : restaurantOffer.discountType === "fixed" ? Number(restaurantOffer.discountValue || 0) : 0
        : 0;
    const discountAmount = appliedCoupon ? couponDiscountAmount : Math.min(cartTotal, restaurantOfferDiscountAmount);
    const finalAmount = Math.max(0, cartTotal - discountAmount);

    const handlePlaceOrder = async (e) => {
        e.preventDefault();

        if (loading || couponLoading) return;

        setCheckoutMessage("");
        let paymentWindowOpened = false;

        const normalizedAddress = deliveryAddress.trim().replace(/\s+/g, " ");
        if (!normalizedAddress) {
            setAddressError("Please enter your delivery address.");
            return;
        }
        if (normalizedAddress.length < 10) {
            setAddressError("Please enter a more complete address (at least 10 characters).");
            return;
        }
        if (normalizedAddress.length > 500) {
            setAddressError("Your delivery address must be 500 characters or fewer.");
            return;
        }
        setAddressError("");

        if (cart.length === 0) {
            setCheckoutMessage("Your cart is empty. Add items before checking out.");
            setCheckoutMessageType("error");
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            if (!token) {
                navigate("/login");
                return;
            }

            const restaurantId = cart[0].restaurantId;

            const items = cart.map((item) => ({
                productId: item._id,
                quantity: item.quantity,
            }));

            // Send the coupon code to the backend.
            const couponCode = appliedCoupon?.code || null;
            const selectedRestaurantOfferId = offerMatchesCart ? restaurantOffer.restaurantOfferId : null;
            if (restaurantOffer && !offerMatchesCart) {
                setCheckoutMessage("This offer is only valid at a different restaurant. Choose that restaurant or remove the offer.");
                setCheckoutMessageType("error");
                return;
            }
            if (selectedRestaurantOfferId && couponCode) {
                setCheckoutMessage("Use either a coupon or a restaurant offer, not both.");
                setCheckoutMessageType("error");
                return;
            }

            // Cash on Delivery
            if (paymentMethod === "COD") {
                const response = await apiClient.post(
                    "/api/orders",
                    {
                        restaurantId,
                        items,
                        deliveryAddress: normalizedAddress,
                        couponCode,
                        restaurantOfferId: selectedRestaurantOfferId,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.data.status === 1) {
                    clearCart();
                    alert("Order placed successfully!");
                    navigate("/");
                } else {
                    setCheckoutMessage(
                        response.data.message || "Failed to place order"
                    );
                    setCheckoutMessageType("error");
                }

                return;
            }

            // Load Razorpay Checkout script.
            const loadRazorpayScript = () =>
                new Promise((resolve) => {
                    if (window.Razorpay) {
                        resolve(true);
                        return;
                    }

                    const script = document.createElement("script");
                    script.src =
                        "https://checkout.razorpay.com/v1/checkout.js";

                    script.onload = () => resolve(true);
                    script.onerror = () => resolve(false);

                    document.body.appendChild(script);
                });

            const scriptLoaded = await loadRazorpayScript();

            if (!scriptLoaded) {
                setCheckoutMessage("Unable to load Razorpay. Check your connection and try again.");
                setCheckoutMessageType("error");
                return;
            }

            // Create Razorpay order using server-calculated discount.
            const orderResponse = await apiClient.post(
                "/api/payments/razorpay/order",
                {
                    restaurantId,
                    items,
                    deliveryAddress: normalizedAddress,
                    couponCode,
                    restaurantOfferId: selectedRestaurantOfferId,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (orderResponse.data.status !== 1) {
                setCheckoutMessage(
                    orderResponse.data.message || "Unable to start online payment"
                );
                setCheckoutMessageType("error");
                return;
            }

            const paymentOrder = orderResponse.data.data;

            const options = {
                key: paymentOrder.keyId,
                amount: paymentOrder.amount,
                currency: paymentOrder.currency,
                name: "WebBites",
                description: couponCode
                    ? `Food Order Payment (${couponCode})`
                    : "Food Order Payment",
                order_id: paymentOrder.razorpayOrderId,

                handler: async (paymentResponse) => {
                    setLoading(true);

                    try {
                        const verificationResponse = await apiClient.post(
                            "/api/payments/razorpay/verify",
                            {
                                razorpay_order_id:
                                    paymentResponse.razorpay_order_id,
                                razorpay_payment_id:
                                    paymentResponse.razorpay_payment_id,
                                razorpay_signature:
                                    paymentResponse.razorpay_signature,
                            },
                            {
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                },
                            }
                        );

                        if (verificationResponse.data.status === 1) {
                            clearCart();
                            alert(
                                "Payment successful! Your order has been placed."
                            );
                            navigate("/");
                        } else {
                            setCheckoutMessage(
                                verificationResponse.data.message ||
                                "Payment verification failed. If money was deducted, contact support before trying again."
                            );
                            setCheckoutMessageType("error");
                            setLoading(false);
                        }
                    } catch (verificationError) {
                        console.error(
                            "Payment verification error:",
                            verificationError
                        );

                        setCheckoutMessage(
                            "We couldn't confirm your order. If money was deducted, contact support before trying to pay again."
                        );
                        setCheckoutMessageType("error");
                        setLoading(false);
                    }
                },

                modal: {
                    ondismiss: () => {
                        setLoading(false);
                    },
                },

                theme: {
                    color: "#ef4444",
                },
            };

            const razorpayCheckout = new window.Razorpay(options);

            razorpayCheckout.on("payment.failed", (response) => {
                console.error(
                    "Razorpay payment failed:",
                    response.error
                );

                setCheckoutMessage(
                    response.error?.description || "Payment failed. You can try again."
                );
                setCheckoutMessageType("error");
                setLoading(false);
            });

            razorpayCheckout.open();
            paymentWindowOpened = true;
        } catch (error) {
            console.error("Place order error:", error);

            setCheckoutMessage(
                error.response?.data?.message || "Unable to place order. Please try again."
            );
            setCheckoutMessageType("error");
        } finally {
            if (!paymentWindowOpened) {
                setLoading(false);
            }
        }
    };

    if (cart.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
                <div className="text-center">
                    <div className="text-6xl">🛒</div>

                    <h1 className="mt-4 text-3xl font-bold text-gray-900">
                        Your Cart is Empty
                    </h1>

                    <Link
                        to="/restaurants"
                        className="mt-6 inline-block rounded-xl bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600"
                    >
                        Browse Restaurants
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="border-b border-gray-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link
                        to="/"
                        className="text-2xl font-extrabold text-gray-900"
                    >
                        Web<span className="text-red-500">Bites</span>
                    </Link>

                    <Link
                        to="/cart"
                        className="text-sm font-medium text-gray-600 hover:text-red-500"
                    >
                        ← Back to Cart
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
                <h1 className="text-3xl font-bold text-gray-900">
                    Checkout
                </h1>

                <p className="mt-2 text-gray-500">
                    Enter your delivery details to place your order.
                </p>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">
                    {/* Delivery Details */}
                    <div className="lg:col-span-2">
                        <form
                            onSubmit={handlePlaceOrder}
                            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                        >
                            <h2 className="text-xl font-bold text-gray-900">
                                Delivery Details
                            </h2>

                            <div className="mt-6">
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Delivery Address
                                </label>

                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-xs text-gray-500">
                                        {profileAddressLoading
                                            ? "Checking your saved profile address..."
                                            : savedAddress
                                                ? `Your default ${savedAddressLabel === "default" ? "delivery" : savedAddressLabel.toLowerCase()} address is available to use or edit.`
                                                : "No saved delivery address found. Enter your delivery address below."}
                                    </p>
                                    {savedAddress && (
                                        <button
                                            type="button"
                                            onClick={useSavedAddress}
                                            disabled={profileAddressLoading}
                                            className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Use default address
                                        </button>
                                    )}
                                </div>

                                <textarea
                                    value={deliveryAddress}
                                    onChange={(e) => {
                                        setDeliveryAddress(e.target.value);
                                        setAddressMessage("");
                                        setAddressError("");
                                    }}
                                    placeholder="Enter your complete delivery address"
                                    rows="5"
                                    maxLength={500}
                                    required
                                    aria-invalid={Boolean(addressError)}
                                    aria-describedby={addressError ? "delivery-address-error" : "delivery-address-help"}
                                    className={`w-full rounded-xl border px-4 py-3 outline-none focus:border-red-500 ${addressError ? "border-red-500" : "border-gray-300"}`}
                                />
                                <div className="mt-1 flex justify-between gap-3 text-xs text-gray-500">
                                    <p id="delivery-address-help">Include house/flat, street, area, and a useful landmark.</p>
                                    <span>{deliveryAddress.length}/500</span>
                                </div>
                                {addressError && (
                                    <p id="delivery-address-error" className="mt-2 text-sm text-red-600" role="alert">
                                        {addressError}
                                    </p>
                                )}
                                {addressMessage && (
                                    <p className="mt-2 text-sm text-green-700" role="status">
                                        {addressMessage}
                                    </p>
                                )}
                            </div>

                            {/* Coupon Section */}
                            <div className="mt-8 border-t border-gray-200 pt-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Apply Coupon
                                </h2>

                                {!appliedCoupon ? (
                                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                        <input
                                            type="text"
                                            value={couponInput}
                                            onChange={(e) => {
                                                setCouponInput(
                                                    e.target.value.toUpperCase()
                                                );
                                                setCouponMessage("");
                                                setCouponMessageType("");
                                            }}
                                            placeholder="Enter coupon code"
                                            className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 uppercase outline-none focus:border-red-500"
                                            disabled={couponLoading || loading}
                                        />

                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={
                                                couponLoading ||
                                                loading ||
                                                !couponInput.trim()
                                            }
                                            className="rounded-xl bg-gray-900 px-6 py-3 font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {couponLoading
                                                ? "Checking..."
                                                : "Apply Coupon"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="font-bold text-green-800">
                                                {appliedCoupon.code} applied
                                            </p>
                                            <p className="text-sm text-green-700">
                                                You save ₹
                                                {couponDiscountAmount.toFixed(2)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleRemoveCoupon}
                                            disabled={loading}
                                            className="font-semibold text-red-600 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}

                                {restaurantOffer && (
                                    <div className={`mb-4 rounded-xl border p-4 ${offerMatchesCart ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"}`}>
                                        <p className="font-semibold text-gray-900">Restaurant offer: {restaurantOffer.offerName}</p>
                                        <p className="mt-1 text-sm text-gray-600">{restaurantOffer.restaurantName} · {restaurantOffer.discountType === "percentage" ? `${restaurantOffer.discountValue}% off` : restaurantOffer.discountType === "free_delivery" ? "Free delivery offer" : `₹${restaurantOffer.discountValue} off`}</p>
                                        <p className="mt-1 text-xs text-gray-600">{offerMatchesCart ? "This offer will be validated at checkout." : "This offer applies only to the restaurant shown above."}</p>
                                        <button type="button" onClick={handleRemoveRestaurantOffer} className="mt-2 text-sm font-semibold text-red-600 underline">Remove offer</button>
                                    </div>
                                )}

                                {couponMessage && (
                                    <p
                                        className={`mt-3 text-sm ${
                                            couponMessageType === "success"
                                                ? "text-green-600"
                                                : "text-red-600"
                                        }`}
                                    >
                                        {couponMessage}
                                    </p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div className="mt-8 border-t border-gray-200 pt-6">
                                <h2 className="text-xl font-bold text-gray-900">
                                    Payment Method
                                </h2>

                                <div className="mt-4 space-y-3">
                                    <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                            paymentMethod === "COD"
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200 bg-white"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === "COD"}
                                            onChange={() =>
                                                setPaymentMethod("COD")
                                            }
                                            className="accent-red-500"
                                        />

                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Cash on Delivery
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Pay when your food arrives.
                                            </p>
                                        </div>
                                    </label>

                                    <label
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                                            paymentMethod === "Online"
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200 bg-white"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="Online"
                                            checked={paymentMethod === "Online"}
                                            onChange={() =>
                                                setPaymentMethod("Online")
                                            }
                                            className="accent-red-500"
                                        />

                                        <div>
                                            <p className="font-semibold text-gray-800">
                                                Online Payment
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                Pay securely using Razorpay.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {checkoutMessage && (
                                <p
                                    className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                                        checkoutMessageType === "success"
                                            ? "border-green-200 bg-green-50 text-green-800"
                                            : "border-red-200 bg-red-50 text-red-700"
                                    }`}
                                    role="alert"
                                >
                                    {checkoutMessage}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading || couponLoading}
                                className="mt-8 w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading
                                    ? "Processing..."
                                    : paymentMethod === "Online"
                                      ? `Pay ₹${finalAmount.toFixed(2)}`
                                      : `Place Order · ₹${finalAmount.toFixed(2)}`}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900">
                            Order Summary
                        </h2>

                        <div className="mt-6 space-y-4">
                            {cart.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex justify-between gap-4"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">
                                            {item.productName}
                                        </p>

                                        <p className="text-sm text-gray-500">
                                            {item.quantity} × ₹{item.price}
                                        </p>
                                    </div>

                                    <p className="font-semibold text-gray-800">
                                        ₹
                                        {(
                                            item.price * item.quantity
                                        ).toFixed(2)}
                                    </p>
                                </div>
                            ))}

                            <div className="space-y-3 border-t border-gray-200 pt-4">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>₹{cartTotal.toFixed(2)}</span>
                                </div>

                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({appliedCoupon.code})</span>
                                        <span>-₹{couponDiscountAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                {restaurantOffer && offerMatchesCart && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount ({restaurantOffer.offerName})</span>
                                        <span>-₹{restaurantOfferDiscountAmount.toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-bold">
                                    <span>Total</span>
                                    <span>₹{finalAmount.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Checkout;

