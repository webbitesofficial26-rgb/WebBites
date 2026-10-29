import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import apiClient from "../../config/apiClient";
import Header from "./Header";
import Footer from "./Footer";

const categories = [
  {
    name: "Pizza",
    image:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Indian",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Chinese",
    image:
      "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Desserts",
    image:
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Biryani",
    image:
      "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=500&q=80",
  },
];

const fallbackRestaurantImage = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80";

const recommendationStopWords = new Set([
  "and", "with", "the", "for", "from", "fresh", "special", "classic",
  "delicious", "best", "new", "food", "meal", "combo", "regular",
]);

const getFoodTokens = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !recommendationStopWords.has(token));

const buildFoodRecommendations = (products, orders) => {
  const preferences = new Map();
  const previouslyOrdered = new Set();
  const usableOrders = [...orders]
    .filter((order) => order.status !== "Cancelled")
    .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0));

  usableOrders.forEach((order, orderIndex) => {
    const recencyWeight = Math.max(1, 4 - Math.min(orderIndex, 3));
    (Array.isArray(order.items) ? order.items : []).forEach((item) => {
      const productName = String(item.productName || "").trim().toLowerCase();
      if (productName) previouslyOrdered.add(productName);
      getFoodTokens(item.productName).forEach((token) => {
        preferences.set(token, (preferences.get(token) || 0) + recencyWeight);
      });
    });
  });

  const candidates = products
    .filter((product) => !previouslyOrdered.has(String(product.productName || "").trim().toLowerCase()))
    .map((product) => {
      const productTokens = new Set([
        ...getFoodTokens(product.productName),
        ...getFoodTokens(product.description),
        ...getFoodTokens(product.category),
      ]);
      let score = 0;
      productTokens.forEach((token) => { score += preferences.get(token) || 0; });
      return { ...product, recommendationScore: score };
    });

  if (preferences.size > 0) {
    const personalized = candidates
      .filter((product) => product.recommendationScore > 0)
      .sort((first, second) => second.recommendationScore - first.recommendationScore);
    if (personalized.length > 0) return { items: personalized.slice(0, 6), personalized: true };
  }

  // New customers (or customers with no matching history) get a varied discovery list.
  const discovered = [];
  const usedCategories = new Set();
  const sortedCandidates = [...candidates].sort((first, second) =>
    String(first.productName || "").localeCompare(String(second.productName || ""))
  );
  sortedCandidates.forEach((product) => {
    const category = String(product.category || "Other").trim().toLowerCase();
    if (discovered.length < 6 && !usedCategories.has(category)) {
      discovered.push(product);
      usedCategories.add(category);
    }
  });
  sortedCandidates.forEach((product) => {
    if (discovered.length < 6 && !discovered.some((item) => item._id === product._id)) discovered.push(product);
  });
  return { items: discovered, personalized: false };
};

function App() {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsError, setRestaurantsError] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationsPersonalized, setRecommendationsPersonalized] = useState(false);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [recommendationsError, setRecommendationsError] = useState(false);
  const [offers, setOffers] = useState([]);
  const [offersLoading, setOffersLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableOffers = async () => {
      try {
        const response = await apiClient.get("/api/coupons/available");
        if (response.data?.status === 1 && Array.isArray(response.data.data)) {
          setOffers(response.data.data);
        } else {
          setOffers([]);
        }
      } catch (error) {
        console.error("Unable to load homepage offers:", error);
        setOffers([]);
      } finally {
        setOffersLoading(false);
      }
    };

    fetchAvailableOffers();
  }, []);

  const getOfferTitle = (offer) => offer.discountType === "percentage"
    ? `${offer.discountValue}% OFF`
    : offer.discountType === "free_delivery"
      ? "FREE DELIVERY"
      : `₹${offer.discountValue} OFF`;

  const getOfferSubtitle = (offer) => offer.description || (
    Number(offer.minOrderAmount) > 0
      ? `On orders above ₹${offer.minOrderAmount}`
      : "Save on your next order"
  );

  const startOfferOrder = (code) => {
    sessionStorage.setItem("webbites_pending_coupon", code);
  };

  useEffect(() => {
    const fetchHomepageData = async () => {
      setRestaurantsLoading(true);
      setRestaurantsError(false);
      setRecommendationsLoading(true);
      setRecommendationsError(false);

      try {
        const response = await apiClient.get("/api/restaurants");
        if (response.data.status !== 1 || !Array.isArray(response.data.data)) {
          setRestaurantsError(true);
          setRecommendationsError(true);
          return;
        }

        const openRestaurants = response.data.data.filter((restaurant) => restaurant.isOpen);
        setRestaurants(openRestaurants.slice(0, 3));
        setRestaurantsLoading(false);

        const restaurantsForProducts = openRestaurants.slice(0, 8);
        const productResponses = await Promise.allSettled(
          restaurantsForProducts.map(async (restaurant) => {
            const productResponse = await apiClient.get(`/api/products/restaurant/${restaurant._id}`);
            if (productResponse.data.status !== 1 || !Array.isArray(productResponse.data.data)) return [];
            return productResponse.data.data.map((product) => ({ ...product, restaurant }));
          })
        );
        const availableProducts = productResponses
          .filter((result) => result.status === "fulfilled")
          .flatMap((result) => result.value);

        let customerOrders = [];
        const token = localStorage.getItem("token");
        if (token) {
          try {
            const ordersResponse = await apiClient.get("/api/customer/orders", {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (ordersResponse.data.status === 1 && Array.isArray(ordersResponse.data.data)) {
              customerOrders = ordersResponse.data.data;
            }
          } catch (error) {
            // A missing or non-customer session should not break the public homepage.
            console.info("Personalized food recommendations are unavailable for this session.");
          }
        }

        const recommendations = buildFoodRecommendations(availableProducts, customerOrders);
        setRecommendedProducts(recommendations.items);
        setRecommendationsPersonalized(recommendations.personalized);
        if (availableProducts.length === 0) setRecommendationsError(true);
      } catch (error) {
        console.error("Could not load homepage recommendations:", error);
        setRestaurantsError(true);
        setRecommendationsError(true);
      } finally {
        setRestaurantsLoading(false);
        setRecommendationsLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600">
              <span>🔥</span>
              Delicious food, delivered fast
            </div>

            <h1 className="max-w-xl text-5xl font-extrabold leading-tight tracking-tight text-gray-900 md:text-6xl">
              Your cravings.
              <br />
              <span className="text-red-500">Our mission.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Order from the best restaurants around you and enjoy your
              favourite meals delivered straight to your doorstep.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/restaurants" className="rounded-xl bg-red-500 px-7 py-3 text-sm font-semibold text-white transition hover:bg-red-600">Explore Restaurants</Link>
              <Link to="/cust-viewrestaurant" className="rounded-xl border border-gray-300 px-7 py-3 text-sm font-semibold text-gray-700 transition hover:border-red-400 hover:text-red-500">Browse Menu</Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-8">
              <div>
                <p className="text-2xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-500">Restaurants</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">10K+</p>
                <p className="text-sm text-gray-500">Happy Customers</p>
              </div>

              <div>
                <p className="text-2xl font-bold text-gray-900">30 min</p>
                <p className="text-sm text-gray-500">Average Delivery</p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85"
                alt="Delicious food"
                className="h-[450px] w-full object-cover"
              />
            </div>

            <div className="absolute bottom-6 left-6 rounded-2xl bg-white p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 text-lg">
                  ★
                </div>

                <div>
                  <p className="font-bold text-gray-900">4.8 / 5</p>
                  <p className="text-xs text-gray-500">
                    Customer rating
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute right-5 top-5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-lg">
              ⚡ Fast Delivery
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Explore
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              What are you craving?
            </h2>
          </div>

          <Link
            to="/cust-viewrestaurant"
            className="hidden text-sm font-semibold text-red-500 hover:text-red-600 md:block"
          >
            View all →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {categories.map((category) => (
            <Link
              to={`/cust-viewrestaurant?category=${encodeURIComponent(category.name)}`}
              key={category.name}
              className="group"
            >
              <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                <img
                  src={category.image}
                  alt={category.name}
                  className="h-32 w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="p-4 text-center">
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-500">
                    {category.name}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-red-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Deals for you
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              Grab a tasty deal
            </h2>
          </div>

          {offersLoading ? (
            <p className="rounded-xl bg-white p-6 text-gray-500" role="status">Loading available offers...</p>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-gray-600 shadow-sm">
              No active offers right now. Check back soon.
              <Link to="/offers" className="ml-2 font-semibold text-red-500 hover:text-red-600">View offers</Link>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {offers.slice(0, 4).map((offer) => (
                <div
                  key={offer.code}
                  className="flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-white p-6 shadow-sm"
                >
                  <div>
                    <p className="text-3xl font-extrabold text-red-500">{getOfferTitle(offer)}</p>
                    <p className="mt-1 text-gray-600">{getOfferSubtitle(offer)}</p>
                    <div className="mt-4 inline-block rounded-lg border border-dashed border-gray-300 px-3 py-1 text-xs font-semibold text-gray-600">
                      CODE: {offer.code}
                    </div>
                  </div>
                  <Link
                    to="/cust-viewrestaurant"
                    onClick={() => startOfferOrder(offer.code)}
                    className="shrink-0 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-red-500"
                  >
                    Order Now
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
                Popular near you
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                Top restaurants
              </h2>
            </div>

            <Link
              to="/cust-viewrestaurant"
              className="hidden text-sm font-semibold text-red-500 hover:text-red-600 md:block"
            >
              View all →
            </Link>
          </div>

          {restaurantsLoading ? (
            <p className="mt-8 rounded-xl bg-white p-8 text-center text-gray-500" role="status">
              Loading featured restaurants...
            </p>
          ) : restaurantsError ? (
            <div className="mt-8 rounded-xl bg-white p-8 text-center">
              <p className="text-sm text-gray-600" role="alert">
                Featured restaurants couldn't be loaded right now.
              </p>
              <Link to="/cust-viewrestaurant" className="mt-3 inline-block font-semibold text-red-500 hover:text-red-600">
                Browse all restaurants
              </Link>
            </div>
          ) : restaurants.length === 0 ? (
            <p className="mt-8 rounded-xl bg-white p-8 text-center text-gray-500">
              No open restaurants are available right now. Please check back soon.
            </p>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Link
                  to={`/restaurant-menu/${restaurant._id}`}
                  key={restaurant._id}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden">
                    <img
                      src={restaurant.image || fallbackRestaurantImage}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackRestaurantImage;
                      }}
                      alt={restaurant.restaurantName || "Restaurant"}
                      className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1 text-xs font-bold text-green-700 shadow">
                      Open now
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-red-500">
                      {restaurant.restaurantName || "Restaurant"}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-500">
                      {restaurant.address || "Explore this restaurant's menu."}
                    </p>
                    <p className="mt-4 text-sm font-semibold text-red-500">
                      View menu →
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
                {recommendationsPersonalized ? "Picked around your taste" : "Discover something new"}
              </p>
              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                {recommendationsPersonalized ? "Recommended for you" : "Food picks to explore"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-gray-500">
                {recommendationsPersonalized
                  ? "Suggestions are matched to food names in your previous orders."
                  : "Explore available dishes from open restaurants. Your recommendations can become more personal as you order."}
              </p>
            </div>
            <Link to="/cust-viewrestaurant" className="text-sm font-semibold text-red-500 hover:text-red-600">
              Browse all food →
            </Link>
          </div>

          {recommendationsLoading ? (
            <p className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500" role="status">
              Finding food picks for you...
            </p>
          ) : recommendationsError ? (
            <div className="mt-8 rounded-xl bg-gray-50 p-8 text-center">
              <p className="text-sm text-gray-600" role="alert">Food recommendations aren't available right now.</p>
              <Link to="/cust-viewrestaurant" className="mt-3 inline-block font-semibold text-red-500 hover:text-red-600">
                Browse restaurants
              </Link>
            </div>
          ) : recommendedProducts.length === 0 ? (
            <p className="mt-8 rounded-xl bg-gray-50 p-8 text-center text-gray-500">
              No available dishes to recommend right now. Please check back soon.
            </p>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recommendedProducts.map((product) => (
                <Link
                  to={`/restaurant-menu/${product.restaurant?._id || product.restaurantId}`}
                  key={product._id}
                  className="group flex overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <img
                    src={product.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80"}
                    onError={(event) => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80";
                    }}
                    alt={product.productName || "Food item"}
                    loading="lazy"
                    className="h-32 w-32 flex-shrink-0 object-cover sm:h-36 sm:w-36"
                  />
                  <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-red-500">
                      {product.category || "Food"}
                    </p>
                    <h3 className="mt-1 line-clamp-1 font-bold text-gray-900 group-hover:text-red-500">
                      {product.productName || "Delicious dish"}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                      {product.restaurant?.restaurantName || "Open restaurant"}
                    </p>
                    <p className="mt-3 font-bold text-gray-900">
                      ₹{Number(product.price || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <p className="mt-5 text-xs text-gray-400">
            Recommendation method: a lightweight content-based match using food-name keywords from order history; new customers see a varied discovery list.
          </p>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
              Simple & fast
            </p>

            <h2 className="mt-2 text-3xl font-bold text-gray-900">
              How WebBites works
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                📍
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Choose your location
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Tell us where you want your delicious food delivered.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                🍔
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Pick your favourite
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Browse restaurants and choose whatever makes you hungry.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                🛵
              </div>

              <h3 className="mt-5 text-lg font-bold text-gray-900">
                Get it delivered
              </h3>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Sit back and track your order until it reaches your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default App;