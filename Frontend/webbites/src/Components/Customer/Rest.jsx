import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";




const fallbackRestaurantImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";

const Rest = () => {
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [searchTerm, setSearchTerm] = useState("");
    const [showOpenOnly, setShowOpenOnly] = useState(false);
    const [sortOrder, setSortOrder] = useState("default");
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedCategory = (searchParams.get("category") || "").trim();
    const selectedLocation = (searchParams.get("location") || "").trim();
    const [categoryRestaurantIds, setCategoryRestaurantIds] = useState(null);

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const matchesSearch = `${restaurant.restaurantName || ""} ${restaurant.address || ""}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase().trim());

        const matchesCategory = !selectedCategory ||
            (categoryRestaurantIds && categoryRestaurantIds.has(restaurant._id));
        const matchesLocation = !selectedLocation ||
            (restaurant.address || "").toLowerCase().includes(selectedLocation.toLowerCase());

        return matchesSearch && matchesCategory && matchesLocation && (!showOpenOnly || restaurant.isOpen);
    });

    const displayedRestaurants = [...filteredRestaurants].sort((first, second) => {
        const firstName = (first.restaurantName || "").toLowerCase();
        const secondName = (second.restaurantName || "").toLowerCase();

        if (sortOrder === "az") return firstName.localeCompare(secondName);
        if (sortOrder === "za") return secondName.localeCompare(firstName);
        return 0;
    });

    useEffect(() => {
        const fetchRestaurants = async () => {
            setIsLoading(true);
            setHasError(false);

            try {
                const response = await apiClient.get("/api/restaurants");

                if (response.data.status === 1 && Array.isArray(response.data.data)) {
                    setRestaurants(response.data.data);
                } else {
                    setHasError(true);
                }
            } catch (error) {
                console.error(error);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRestaurants();
    }, [retryCount]);

    useEffect(() => {
        let isActive = true;

        const findRestaurantsByCategory = async () => {
            if (!selectedCategory) {
                setCategoryRestaurantIds(null);
                return;
            }

            setIsLoading(true);
            setHasError(false);

            try {
                const restaurantResponse = await apiClient.get("/api/restaurants");
                if (restaurantResponse.data.status !== 1 || !Array.isArray(restaurantResponse.data.data)) {
                    throw new Error("Could not load restaurants for this category.");
                }

                const matches = await Promise.all(restaurantResponse.data.data.map(async (restaurant) => {
                    try {
                        const productResponse = await apiClient.get(`/api/products/restaurant/${restaurant._id}`);
                        const products = productResponse.data.status === 1 && Array.isArray(productResponse.data.data)
                            ? productResponse.data.data
                            : [];
                        const categoryText = selectedCategory.toLowerCase();
                        const hasMatch = products.some((product) =>
                            `${product.category || ""} ${product.productName || ""} ${product.name || ""} ${product.description || ""}`
                                .toLowerCase()
                                .includes(categoryText)
                        );
                        return hasMatch ? restaurant._id : null;
                    } catch (error) {
                        console.error("Could not check restaurant menu for category:", error);
                        return null;
                    }
                }));

                if (isActive) setCategoryRestaurantIds(new Set(matches.filter(Boolean)));
            } catch (error) {
                console.error(error);
                if (isActive) setHasError(true);
            } finally {
                if (isActive) setIsLoading(false);
            }
        };

        findRestaurantsByCategory();
        return () => { isActive = false; };
    }, [selectedCategory, retryCount]);
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
            to="/"
            className="text-sm font-medium text-gray-600 hover:text-red-500"
          >
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
            Explore
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Available Restaurants
          </h1>

          <p className="mt-3 text-gray-500">
            Choose from our available restaurants and order your favourite food.
          </p>
          {selectedCategory && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-sm text-gray-700">
                Showing restaurants with menu items related to <strong>{selectedCategory}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete("category");
                  setSearchParams(nextParams);
                }}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Clear category
              </button>
            </div>
          )}
          {selectedLocation && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-sm text-gray-700">
                Filtering restaurant addresses matching <strong>{selectedLocation}</strong>.
              </p>
              <button
                type="button"
                onClick={() => {
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete("location");
                  setSearchParams(nextParams);
                }}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Clear location
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <p className="mt-8 rounded-xl bg-white p-8 text-center text-gray-500">
            Loading restaurants...
          </p>
        ) : hasError ? (
          <div className="mt-8 rounded-xl bg-white p-8 text-center">
            <p role="alert" className="text-red-600">
              Could not load restaurants. Please check your connection and try again.
            </p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-4 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
            >
              Try Again
            </button>
          </div>
        ) : restaurants.length === 0 ? (
          <p className="mt-8 rounded-xl bg-white p-8 text-center text-gray-500">
            No restaurants are available right now. Please check back later.
          </p>
        ) : (
        <>
          <div className="mt-8 max-w-xl">
            <label htmlFor="restaurant-search" className="mb-2 block text-sm font-medium text-gray-700">
              Search restaurants
            </label>
            <input
              id="restaurant-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by restaurant name or address..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              Sort by
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-red-500 focus:outline-none"
              >
                <option value="default">Default order</option>
                <option value="az">Name: A to Z</option>
                <option value="za">Name: Z to A</option>
              </select>
            </label>
            <label className="flex w-fit items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={showOpenOnly}
                onChange={(event) => setShowOpenOnly(event.target.checked)}
                className="h-4 w-4 accent-red-500"
              />
              Show open restaurants only
            </label>
            {(searchTerm || showOpenOnly || sortOrder !== "default" || selectedLocation) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setShowOpenOnly(false);
                  setSortOrder("default");
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete("location");
                  setSearchParams(nextParams);
                }}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Clear search and filters
              </button>
            )}
          </div>
          <p className="mt-4 text-sm text-gray-500" aria-live="polite">
            Showing {filteredRestaurants.length} of {restaurants.length} {restaurants.length === 1 ? "restaurant" : "restaurants"}
          </p>
          {filteredRestaurants.length === 0 ? (
            <p className="mt-6 rounded-xl bg-white p-8 text-center text-gray-500">
              {selectedCategory && categoryRestaurantIds?.size === 0
                ? `No restaurants currently have menu items matching ${selectedCategory}. Try another category.`
                : selectedLocation && !restaurants.some((restaurant) => (restaurant.address || "").toLowerCase().includes(selectedLocation.toLowerCase()))
                  ? `No restaurant addresses match ${selectedLocation}. Try a different city or area, or clear the location filter.`
                  : showOpenOnly && !searchTerm.trim()
                    ? "No open restaurants are available right now."
                    : "No restaurants match your search and filters. Try changing them."}
            </p>
          ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayedRestaurants.map((restaurant) => (
            <div
              key={restaurant._id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <img
                src={restaurant.coverImage || restaurant.image || fallbackRestaurantImage}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackRestaurantImage;
                }}
                alt={restaurant.restaurantName}
                className="h-52 w-full object-cover"
                loading="lazy"
              />

              <div className="p-5">

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {restaurant.restaurantName}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      Restaurant • Food
                    </p>
                  </div>

                  {/* Restaurant Status */}
                  {restaurant.isOpen ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                      ● Open
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                      ● Closed
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  📞 {restaurant.phone}
                </p>

                <p className="mt-4 text-sm text-gray-500">
                  📍 {restaurant.address}
                </p>

                {/* View Restaurant */}
                <div className="mt-5">
                  {restaurant.isOpen ? (
                    <Link
                      to={`/restaurant-menu/${restaurant._id}`}
                      className="inline-block rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                    >
                      View Restaurant
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-lg bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-500"
                    >
                      Currently Closed
                    </button>
                  )}
                </div>

              </div>
            </div>
          ))}
        </div>
          )}
        </>
        )}
      </main>
    </div>
  );
};

export default Rest;