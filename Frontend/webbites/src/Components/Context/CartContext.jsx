import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

// Maximum total food units (sum of quantities) allowed in one order.
export const MAX_ORDER_ITEMS = 20;

const getPositiveQuantity = (value, fallback = 0) => {
    const quantity = Number(value);

    // Cart quantities represent whole items, so discard fractional values.
    if (!Number.isFinite(quantity) || quantity <= 0) {
        return fallback;
    }

    const wholeQuantity = Math.floor(quantity);
    return wholeQuantity > 0 ? wholeQuantity : fallback;
};

export const CartProvider = ({ children }) => {
    // Keep the cart when the customer refreshes or revisits the page.
    const [cartMessage, setCartMessage] = useState("");
    const [cart, setCart] = useState(() => {
        try {
            const savedCart = JSON.parse(localStorage.getItem("webbitesCart"));
            return Array.isArray(savedCart) ? savedCart : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("webbitesCart", JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        if (!cartMessage) return undefined;
        const timer = window.setTimeout(() => setCartMessage(""), 2800);
        return () => window.clearTimeout(timer);
    }, [cartMessage]);

    const addToCart = (product) => {
        // Ignore invalid product data so malformed API/UI values cannot
        // create cart entries without an identifier.
        if (!product || typeof product !== "object" || !product._id) {
            return;
        }

        // Limit the total number of food units in one order.
        if (cartCount >= MAX_ORDER_ITEMS) {
            setCartMessage(`You can add a maximum of ${MAX_ORDER_ITEMS} items per order.`);
            return;
        }

        // An order belongs to one restaurant, so don't mix restaurants in one cart.
        const productRestaurantId = String(product.restaurantId?._id || product.restaurantId || "");
        const cartRestaurantId = String(cart[0]?.restaurantId?._id || cart[0]?.restaurantId || "");

        if (cart.length > 0 && productRestaurantId !== cartRestaurantId) {
            const replaceCart = window.confirm(
                "Your cart contains items from another restaurant. Clear it and add this item instead?"
            );

            if (!replaceCart) {
                return;
            }

            setCart([{ ...product, quantity: 1 }]);
            setCartMessage(`${product.productName || product.name || "Item"} added to cart.`);
            return;
        }

        setCart((prevCart) => {
            const existingProduct = prevCart.find(
                (item) => item._id === product._id
            );

            if (existingProduct) {
                return prevCart.map((item) =>
                    item._id === product._id
                        ? {
                              ...item,
                              quantity: getPositiveQuantity(item.quantity, 1) + 1,
                          }
                        : item
                );
            }

            return [
                ...prevCart,
                {
                    ...product,
                    quantity: 1,
                },
            ];
        });
        setCartMessage(`${product.productName || product.name || "Item"} added to cart.`);
    };

    const removeFromCart = (productId) => {
        if (!productId) return;

        setCart((prevCart) =>
            prevCart.filter((item) => item._id !== productId)
        );
    };

    const increaseQuantity = (productId) => {
        if (!productId) return;
        if (cartCount >= MAX_ORDER_ITEMS) {
            setCartMessage(`You can add a maximum of ${MAX_ORDER_ITEMS} items per order.`);
            return;
        }

        setCart((prevCart) =>
            prevCart.map((item) =>
                item._id === productId
                    ? {
                          ...item,
                          quantity: getPositiveQuantity(item.quantity) + 1,
                      }
                    : item
            )
        );
    };

    const decreaseQuantity = (productId) => {
        if (!productId) return;

        setCart((prevCart) =>
            prevCart
                .map((item) =>
                    item._id === productId
                        ? {
                              ...item,
                              quantity: getPositiveQuantity(item.quantity, 1) - 1,
                          }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const clearCart = () => {
        setCart([]);
    };

    // Keep malformed cached/runtime values from making cart badges or totals NaN.
    const cartCount = cart.reduce((total, item) => {
        const nextCount = total + getPositiveQuantity(item?.quantity);

        // Keep malformed/extreme quantities from making the cart badge non-finite.
        return Number.isFinite(nextCount) ? nextCount : total;
    }, 0);

    const cartTotal = cart.reduce((total, item) => {
        const rawPrice = item?.price;
        const hasPrice =
            rawPrice !== null &&
            rawPrice !== undefined &&
            !(typeof rawPrice === "string" && rawPrice.trim() === "");
        const price = hasPrice ? Number(rawPrice) : Number.NaN;
        const quantity = getPositiveQuantity(item?.quantity);

        // Missing or blank prices must not silently become zero via Number().
        if (!Number.isFinite(price) || price < 0 || quantity <= 0) {
            return total;
        }

        const itemTotal = price * quantity;
        const nextTotal = total + itemTotal;

        // Avoid allowing extreme malformed runtime values to turn the total into Infinity.
        return Number.isFinite(itemTotal) && Number.isFinite(nextTotal)
            ? nextTotal
            : total;
    }, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                cartMessage,
                addToCart,
                removeFromCart,
                increaseQuantity,
                decreaseQuantity,
                clearCart,
                cartCount,
                cartTotal,
                maxOrderItems: MAX_ORDER_ITEMS,
            }}
        >
            {children}
            {cartMessage && (
                <div
                    role="status"
                    aria-live="polite"
                    className="fixed right-4 top-20 z-[100] flex max-w-sm items-center gap-3 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white shadow-xl"
                >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
                    <span>{cartMessage}</span>
                </div>
            )}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    return useContext(CartContext);
};