import { Link } from "react-router-dom";
import { useCart } from "../Context/CartContext"; 
const Cart = () => {
    const {
        cart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        cartTotal,
        cartCount,
        maxOrderItems,
    } = useCart();

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">

                <header className="border-b border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

                        <Link
                            to="/"
                            className="text-2xl font-extrabold text-gray-900"
                        >
                            Web<span className="text-red-500">Bites</span>
                        </Link>

                        <Link
                            to="/cust-viewrestaurant"
                            className="text-sm font-medium text-gray-600 hover:text-red-500"
                        >
                            ← Restaurants
                        </Link>

                    </div>
                </header>

                <div className="flex min-h-[70vh] items-center justify-center px-6">

                    <div className="text-center">

                        <div className="text-7xl">
                            🛒
                        </div>

                        <h1 className="mt-5 text-3xl font-bold text-gray-900">
                            Your Cart is Empty
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Add some delicious food to your cart.
                        </p>

                        <Link
                            to="/cust-viewrestaurant"
                            className="mt-6 inline-block rounded-xl bg-red-500 px-6 py-3 font-semibold text-white hover:bg-red-600"
                        >
                            Browse Restaurants
                        </Link>

                    </div>

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
                        to="/cust-viewrestaurant"
                        className="text-sm font-medium text-gray-600 hover:text-red-500"
                    >
                        ← Continue Shopping
                    </Link>

                </div>
            </header>

            {/* Main */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Your Cart
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Review your food items before checkout.
                        </p>
                        <p className={`mt-2 text-sm font-medium ${cartCount >= maxOrderItems ? "text-red-600" : "text-gray-500"}`}>
                            {cartCount} of {maxOrderItems} items added (maximum per order).
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to remove all items from your cart?")) {
                                clearCart();
                            }
                        }}
                        className="self-start rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 sm:self-auto"
                    >
                        Clear Cart
                    </button>
                </div>

                <div className="mt-8 grid gap-8 lg:grid-cols-3">

                    {/* Cart Items */}
                    <div className="space-y-4 lg:col-span-2">

                        {cart.map((item) => (
                            <div
                                key={item._id}
                                className="flex flex-col gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row"
                            >

                                {/* Image */}
                                {item.image ? (
                                    <img
                                        src={item.image}
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80";
                                        }}
                                        alt={item.productName}
                                        className="h-32 w-full rounded-xl object-cover sm:w-32"
                                    />
                                ) : (
                                    <div className="flex h-32 w-full items-center justify-center rounded-xl bg-gray-100 text-5xl sm:w-32">
                                        🍽️
                                    </div>
                                )}

                                {/* Details */}
                                <div className="flex flex-1 flex-col justify-between">

                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {item.productName}
                                        </h2>

                                        <p className="mt-1 text-sm text-gray-500">
                                            {item.category}
                                        </p>

                                        <p className="mt-2 font-semibold text-red-500">
                                            ₹{item.price}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">

                                        {/* Quantity */}
                                        <div className="flex items-center rounded-lg border border-gray-300">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    decreaseQuantity(item._id)
                                                }
                                                className="px-4 py-2 text-lg font-bold text-gray-600 hover:bg-gray-100"
                                            >
                                                −
                                            </button>

                                            <span className="px-4 font-semibold">
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => increaseQuantity(item._id)}
                                                disabled={cartCount >= maxOrderItems}
                                                title={cartCount >= maxOrderItems ? `Maximum ${maxOrderItems} items per order` : "Increase quantity"}
                                                className={`px-4 py-2 text-lg font-bold ${cartCount >= maxOrderItems ? "cursor-not-allowed text-gray-300" : "text-gray-600 hover:bg-gray-100"}`}
                                            >
                                                +
                                            </button>

                                        </div>

                                        {/* Remove */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeFromCart(item._id)
                                            }
                                            className="text-sm font-semibold text-red-500 hover:text-red-600"
                                        >
                                            Remove
                                        </button>

                                    </div>

                                </div>

                            </div>
                        ))}

                    </div>

                    {/* Summary */}
                    <div className="h-fit rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                        <h2 className="text-xl font-bold text-gray-900">
                            Order Summary
                        </h2>

                        <div className="mt-6 space-y-4">

                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>₹{cartTotal}</span>
                            </div>

                            <div className="flex justify-between text-gray-600">
                                <span>Delivery Fee</span>
                                <span>Free</span>
                            </div>

                            <div className="border-t border-gray-200 pt-4">

                                <div className="flex justify-between text-lg font-bold text-gray-900">
                                    <span>Total</span>
                                    <span>₹{cartTotal}</span>
                                </div>

                            </div>

                        </div>

                       <Link
                            to="/checkout"
                            className="mt-6 block w-full rounded-xl bg-red-500 py-3 text-center font-semibold text-white hover:bg-red-600"
                        >
                            Proceed to Checkout
                        </Link>

                    </div>

                </div>

            </main>

        </div>
    );
};

export default Cart;