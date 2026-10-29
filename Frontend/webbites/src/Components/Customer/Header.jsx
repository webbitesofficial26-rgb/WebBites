import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import { useCart } from "../Context/CartContext";

const Header = () => {
  const navigate = useNavigate();
  const { clearCart, cartCount } = useCart();

  const [showProfile, setShowProfile] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState({
            restaurants: [],
            products: [],
        });
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowMobileNav(false);
        setShowSearch(false);
        setShowProfile(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    // Ignore malformed stored user data so the header can still render.
    localStorage.removeItem("user");
  }

  const handleLogout = () => {
    clearCart();
    localStorage.removeItem("webbitesCart");
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setShowProfile(false);

    navigate("/login");
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!search.trim()) {
        setSearchResults({
            restaurants: [],
            products: [],
        });
        setSearchError(false);
        return;
    }

    try {
        setSearching(true);
        setSearchError(false);

        const response = await apiClient.get(
            `/api/search?search=${encodeURIComponent(search.trim())}`
        );

        if (response.data.status === 1) {
            setSearchResults({
                restaurants: response.data.data.restaurants || [],
                products: response.data.data.products || [],
            });
        } else {
            setSearchResults({ restaurants: [], products: [] });
            setSearchError(true);
        }
    } catch (error) {
        console.error("Search failed:", error);

        setSearchResults({
            restaurants: [],
            products: [],
        });
        setSearchError(true);
    } finally {
        setSearching(false);
    }
};

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:px-6">

        {/* Logo */}

        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-xl">
            🕷️
          </div>

          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Web<span className="text-red-500">Bites</span>
          </h1>
        </Link>


        {/* Navigation */}

        <nav className="hidden items-center gap-8 md:flex">

          <Link
            to="/"
            className="font-medium text-gray-900 transition hover:text-red-500"
          >
            Home
          </Link>

          <Link
            to="/cust-viewrestaurant"
            className="font-medium text-gray-600 transition hover:text-red-500"
          >
            Restaurants
          </Link>

          <Link
            to="/offers"
            className="font-medium text-gray-600 transition hover:text-red-500"
          >
            Offers
          </Link>

          <Link
            to="/my-orders"
            className="font-medium text-gray-600 transition hover:text-red-500"
          >
            My Orders
          </Link>

        </nav>


        {/* Right Side */}

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

          <button
            type="button"
            onClick={() => setShowMobileNav((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-xl text-gray-700 transition hover:bg-gray-100 md:hidden"
            aria-label={showMobileNav ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={showMobileNav}
            aria-controls="customer-mobile-navigation"
          >
            {showMobileNav ? "×" : "☰"}
          </button>

          {/* Search */}

          <div className="relative">

            <button
              type="button"
              onClick={() => {
                  setShowSearch(!showSearch);
                  setSearchResults({
                      restaurants: [],
                      products: [],
                  });
              }}
              className="rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
              title="Search"
              aria-label="Open search"
              aria-expanded={showSearch}
            >
              🔍
            </button>


            {showSearch && (
              <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1.5rem))] rounded-2xl border border-gray-200 bg-white p-3 shadow-xl sm:p-4">

                {/* Search Form */}

                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search restaurants or food..."
                    autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500"
                  />

                  <button
                    type="submit"
                    disabled={searching}
                    className="shrink-0 rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-wait disabled:opacity-60 sm:px-4"
                  >
                    {searching ? "Searching…" : "Search"}
                  </button>
                </form>


               {/* Search Results */}
                {!searching &&
                    (searchResults.restaurants.length > 0 ||
                        searchResults.products.length > 0) && (
                        <div className="mt-4 max-h-96 space-y-4 overflow-y-auto">

                            {/* Restaurants */}
                            {searchResults.restaurants.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                        Restaurants
                                    </h3>

                                    <div className="space-y-2">
                                        {searchResults.restaurants.map((restaurant) => (
                                            <div
                                                key={restaurant._id}
                                                className="rounded-xl border border-gray-200 p-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h4 className="truncate text-sm font-semibold text-gray-900">
                                                            {restaurant.restaurantName}
                                                        </h4>

                                                        <p className="mt-1 truncate text-xs text-gray-500">
                                                            {restaurant.address}
                                                        </p>

                                                        <p
                                                            className={`mt-1 text-xs font-semibold ${
                                                                restaurant.isOpen
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }`}
                                                        >
                                                            {restaurant.isOpen
                                                                ? "● Open"
                                                                : "● Closed"}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={!restaurant.isOpen}
                                                        onClick={() => {
                                                            navigate(
                                                                `/restaurant-menu/${restaurant._id}`
                                                            );

                                                            setShowSearch(false);
                                                            setSearch("");
                                                            setSearchResults({
                                                                restaurants: [],
                                                                products: [],
                                                            });
                                                        }}
                                                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                                                            restaurant.isOpen
                                                                ? "bg-gray-900 hover:bg-red-500"
                                                                : "cursor-not-allowed bg-gray-300"
                                                        }`}
                                                    >
                                                        {restaurant.isOpen ? "View" : "Closed"}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Food Products */}
                            {searchResults.products.length > 0 && (
                                <div>
                                    <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                                        Food Items
                                    </h3>

                                    <div className="space-y-2">
                                        {searchResults.products.map((product) => (
                                            <div
                                                key={product._id}
                                                className="rounded-xl border border-gray-200 p-3"
                                            >
                                                <div className="flex items-start gap-3">
                                                    {product.image && (
                                                        <img
                                                            src={product.image}
                                                            alt={product.productName}
                                                            className="h-14 w-14 rounded-lg object-cover"
                                                        />
                                                    )}

                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-sm font-semibold text-gray-900">
                                                            {product.productName}
                                                        </h4>

                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {product.restaurantId?.restaurantName ||
                                                                "Restaurant"}
                                                        </p>

                                                        <p className="mt-1 text-sm font-semibold text-gray-900">
                                                            ₹{product.price}
                                                        </p>

                                                        <p
                                                            className={`mt-1 text-xs font-semibold ${
                                                                product.available &&
                                                                product.restaurantId?.isOpen
                                                                    ? "text-green-600"
                                                                    : "text-red-600"
                                                            }`}
                                                        >
                                                            {product.available &&
                                                            product.restaurantId?.isOpen
                                                                ? "Available"
                                                                : "Currently unavailable"}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            !product.available ||
                                                            !product.restaurantId?.isOpen
                                                        }
                                                        onClick={() => {
                                                            if (
                                                                product.available &&
                                                                product.restaurantId?.isOpen
                                                            ) {
                                                                navigate(
                                                                    `/restaurant-menu/${product.restaurantId._id}`
                                                                );

                                                                setShowSearch(false);
                                                                setSearch("");
                                                                setSearchResults({
                                                                    restaurants: [],
                                                                    products: [],
                                                                });
                                                            }
                                                        }}
                                                        className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold text-white ${
                                                            product.available &&
                                                            product.restaurantId?.isOpen
                                                                ? "bg-gray-900 hover:bg-red-500"
                                                                : "cursor-not-allowed bg-gray-300"
                                                        }`}
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                {/* Searching */}
                {searching && (
                    <p className="mt-4 text-center text-sm text-gray-500">
                        Searching...
                    </p>
                )}

                {/* Search Error */}
                {search.trim() && !searching && searchError && (
                    <p className="mt-4 text-center text-sm text-red-500" role="alert">
                        Search failed. Please try again.
                    </p>
                )}

                {/* No Results */}
                {search.trim() &&
                    !searching &&
                    !searchError &&
                    searchResults.restaurants.length === 0 &&
                    searchResults.products.length === 0 && (
                        <p className="mt-4 text-center text-sm text-gray-500">
                            No restaurants or food items found.
                        </p>
                    )}

              </div>
            )}

          </div>


          {/* Cart */}

          <Link
            to="/cart"
            className="relative rounded-full p-2 text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            title="Cart"
            aria-label={`Cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
          >
            🛒

            <span
              className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white"
              aria-live="polite"
              aria-atomic="true"
            >
              {cartCount}
            </span>
          </Link>


          {/* Show partner links only when NOT logged in */}

          {!user && (
            <>
              <Link
                to="/restaurant/register"
                className="hidden text-sm font-semibold text-gray-600 transition hover:text-red-500 lg:block"
              >
                Partner with us
              </Link>

              <Link
                to="/delivery/register"
                className="hidden text-sm font-semibold text-gray-600 transition hover:text-red-500 lg:block"
              >
                Become a Delivery Partner
              </Link>
            </>
          )}


          {/* User Profile / Login */}

          {user ? (

            <div className="relative">

              <button
                type="button"
                onClick={() => setShowProfile(!showProfile)}
                aria-label="Customer profile menu"
                aria-expanded={showProfile}
                className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
              >
                👤

                <span className="hidden max-w-28 truncate sm:inline">
                  {user.name}
                </span>

                <span className="text-xs">
                  ▼
                </span>
              </button>


              {/* Profile Dropdown */}

              {showProfile && (
                <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg bg-white py-2 shadow-lg ring-1 ring-gray-200">

                  <Link
                    to="/customer/profile"
                    onClick={() => setShowProfile(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Profile
                  </Link>

                  <Link
                    to="/customer/addresses"
                    onClick={() => setShowProfile(false)}
                    className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Addresses
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-gray-100"
                  >
                    Logout
                  </button>

                </div>
              )}

            </div>

          ) : (

            <Link
              to="/login"
              className="rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              Login
            </Link>

          )}

        </div>

      </div>

      {showMobileNav && (
        <nav
          id="customer-mobile-navigation"
          aria-label="Customer navigation"
          className="space-y-1 border-t border-gray-100 bg-white px-3 py-3 shadow-sm md:hidden sm:px-6"
        >
          {[
            { to: "/", label: "Home" },
            { to: "/cust-viewrestaurant", label: "Restaurants" },
            { to: "/offers", label: "Offers" },
            { to: "/my-orders", label: "My Orders" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setShowMobileNav(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
};

export default Header;