import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import apiClient from "../../config/apiClient";
import { useCart } from "../Context/CartContext";

const ViewRestaurant = () => {
    const { addToCart, cartCount } = useCart();
    const { restaurantId } = useParams();

    const [products, setProducts] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const [reviews, setReviews] = useState([]);
    const [averageRating, setAverageRating] = useState(0);
    const [totalReviews, setTotalReviews] = useState(0);
    const [foodSearchTerm, setFoodSearchTerm] = useState("");
    const [selectedFoodCategory, setSelectedFoodCategory] = useState("all");
    const [selectedDietaryType, setSelectedDietaryType] = useState("all");
    const [sortOption, setSortOption] = useState("default");
    const [showAvailableOnly, setShowAvailableOnly] = useState(false);

    const foodCategories = [...new Set(products
        .map((product) => (product.category || "").trim())
        .filter(Boolean))].sort((first, second) => first.localeCompare(second));

    const getPrice = (product) => {
        const price = Number(product.price);
        return Number.isFinite(price) ? price : 0;
    };

    const filteredProducts = products
        .filter((product) => {
            const searchText = `${product.productName || ""} ${product.description || ""} ${product.category || ""}`.toLowerCase();
            const matchesSearch = searchText.includes(foodSearchTerm.trim().toLowerCase());
            const normalizedCategory = (product.category || "").trim();
            const matchesCategory = selectedFoodCategory === "all" || normalizedCategory === selectedFoodCategory;
            const matchesDietaryType = selectedDietaryType === "all" || product.dietaryType === selectedDietaryType;
            const matchesAvailability = !showAvailableOnly || product.available === true;
            return matchesSearch && matchesCategory && matchesDietaryType && matchesAvailability;
        })
        .slice()
        .sort((first, second) => {
            if (sortOption === "price-low") return getPrice(first) - getPrice(second);
            if (sortOption === "price-high") return getPrice(second) - getPrice(first);
            if (sortOption === "name-az") return (first.productName || "").localeCompare(second.productName || "");
            return 0;
        });
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setHasError(false);

            try {
            const restaurantResponse = await apiClient.get("/api/restaurants");

            if (
                restaurantResponse.data.status !== 1 ||
                !Array.isArray(restaurantResponse.data.data)
            ) {
                setHasError(true);
                return;
            }

            const selectedRestaurant = restaurantResponse.data.data.find(
                (item) => item._id === restaurantId
            );

            if (!selectedRestaurant) {
                setHasError(true);
                return;
            }

            setRestaurant(selectedRestaurant);

            const productResponse = await apiClient.get(`/api/products/restaurant/${restaurantId}`);

            if (
                productResponse.data.status !== 1 ||
                !Array.isArray(productResponse.data.data)
            ) {
                setHasError(true);
                return;
            }

            setProducts(productResponse.data.data);

            const reviewResponse = await apiClient.get(`/api/reviews/restaurant/${restaurantId}`);

            if (reviewResponse.data.status !== 1 || !reviewResponse.data.data) {
                setHasError(true);
                return;
            }

            setReviews(reviewResponse.data.data.reviews || []);
            setAverageRating(reviewResponse.data.data.averageRating || 0);
            setTotalReviews(reviewResponse.data.data.totalReviews || 0);
            } catch (error) {
            console.error(error);
            setHasError(true);
            } finally {
            setLoading(false);
            }
        };

        fetchData();
        }, [restaurantId, retryCount]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-lg text-gray-500">
                    Loading menu...
                </p>
            </div>
        );
    }

    if (hasError) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
                <p role="alert" className="text-lg text-red-600">
                    Could not load this restaurant's menu. Please check your connection and try again.
                </p>
                <button
                    type="button"
                    onClick={() => setRetryCount((count) => count + 1)}
                    className="mt-4 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white hover:bg-red-600"
                >
                    Try Again
                </button>
                <Link to="/cust-viewrestaurant" className="mt-4 text-sm font-medium text-gray-600 hover:text-red-500">
                    Back to Restaurants
                </Link>
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

                    <div className="flex items-center gap-6">

                        <Link
                            to="/cart"
                            className="font-semibold text-gray-700 hover:text-red-500"
                        >
                            🛒 Cart ({cartCount})
                        </Link>

                        <Link
                            to="/cust-viewrestaurant"
                            className="text-sm font-medium text-gray-600 hover:text-red-500"
                        >
                            ← Restaurants
                        </Link>

                    </div>

                </div>
            </header>

                
            {/* Restaurant Information */}
            <div className="bg-white">
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">

                    {restaurant && (
                        <>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {restaurant.restaurantName}
                            </h1>

                            <p className="mt-2 text-gray-500">
                                📍 {restaurant.address}
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                📞 {restaurant.phone}
                            </p>
                            
                        </>
                        
                    )}
                    {totalReviews > 0 ? (
                        <div className="mt-3 flex items-center gap-3">
                            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                            ⭐ {averageRating}
                            </span>

                            <span className="text-sm text-gray-500">
                            {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
                            </span>
                        </div>
                        ) : (
                        <p className="mt-3 text-sm text-gray-500">
                            No reviews yet
                        </p>
                        )}

                </div>
            </div>

            {/* Menu */}
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">

                <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-widest text-red-500">
                        Menu
                    </p>

                    <h2 className="mt-2 text-3xl font-bold text-gray-900">
                        Available Food
                    </h2>
                </div>

                {products.length === 0 ? (
                    <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                        <p className="text-gray-500">
                            No food items are currently available.
                        </p>
                    </div>
                ) : (
                    <>
                    <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5" aria-label="Search and filter menu">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                            <div>
                                <label htmlFor="food-search" className="mb-2 block text-sm font-semibold text-gray-700">
                                    Search this menu
                                </label>
                                <input
                                    id="food-search"
                                    type="search"
                                    value={foodSearchTerm}
                                    onChange={(event) => setFoodSearchTerm(event.target.value)}
                                    placeholder="Search by food name, description, or category..."
                                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                />
                            </div>
                            <div>
                                <label htmlFor="food-category" className="mb-2 block text-sm font-semibold text-gray-700">
                                    Food category
                                </label>
                                <select
                                    id="food-category"
                                    value={selectedFoodCategory}
                                    onChange={(event) => setSelectedFoodCategory(event.target.value)}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                >
                                    <option value="all">All categories</option>
                                    {foodCategories.map((category) => (
                                        <option key={category} value={category}>{category}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="food-sort" className="mb-2 block text-sm font-semibold text-gray-700">
                                    Sort food
                                </label>
                                <select
                                    id="food-sort"
                                    value={sortOption}
                                    onChange={(event) => setSortOption(event.target.value)}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                >
                                    <option value="default">Recommended order</option>
                                    <option value="price-low">Price: low to high</option>
                                    <option value="price-high">Price: high to low</option>
                                    <option value="name-az">Name: A to Z</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="food-type" className="mb-2 block text-sm font-semibold text-gray-700">
                                    Food type
                                </label>
                                <select
                                    id="food-type"
                                    value={selectedDietaryType}
                                    onChange={(event) => setSelectedDietaryType(event.target.value)}
                                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                >
                                    <option value="all">Veg & Non-Veg</option>
                                    <option value="veg">🟢 Veg only</option>
                                    <option value="nonveg">🔴 Non-Veg only</option>
                                </select>
                            </div>
                            <div className="flex items-end">
                                <label className="flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-300 px-4 py-3 text-sm font-semibold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={showAvailableOnly}
                                        onChange={(event) => setShowAvailableOnly(event.target.checked)}
                                        className="h-4 w-4 accent-red-500"
                                    />
                                    Available items only
                                </label>
                            </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-gray-500" aria-live="polite">
                                Showing {filteredProducts.length} of {products.length} food {products.length === 1 ? "item" : "items"}
                            </p>
                            {(foodSearchTerm || selectedFoodCategory !== "all" || selectedDietaryType !== "all" || sortOption !== "default" || showAvailableOnly) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFoodSearchTerm("");
                                        setSelectedFoodCategory("all");
                                        setSelectedDietaryType("all");
                                        setSortOption("default");
                                        setShowAvailableOnly(false);
                                    }}
                                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                                >
                                    Clear food filters
                                </button>
                            )}
                        </div>
                    </section>

                    {filteredProducts.length === 0 ? (
                        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                            <p className="font-semibold text-gray-800">No food items match your search.</p>
                            <p className="mt-2 text-sm text-gray-500">Try another keyword or clear the food filters.</p>
                        </div>
                    ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

                        {filteredProducts.map((product) => (
                            <div
                                key={product._id}
                                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                            >

                                {/* Food Image */}
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.productName || "Food item"}
                                        className="h-52 w-full object-cover"
                                        loading="lazy"
                                        onError={(event) => {
                                            event.currentTarget.style.display = "none";
                                        }}
                                    />
                                ) : (
                                    <div className="flex h-52 items-center justify-center bg-gray-100">
                                        <span className="text-6xl">
                                            🍽️
                                        </span>
                                    </div>
                                )}

                                {/* Food Details */}
                                <div className="p-5">

                                    <div className="flex items-start justify-between gap-3">

                                        <h3 className="text-xl font-bold text-gray-900">
                                            {product.productName}
                                        </h3>

                                        <span className="whitespace-nowrap rounded-lg bg-red-50 px-3 py-1 text-sm font-semibold text-red-500">
                                            ₹{product.price}
                                        </span>

                                    </div>

                                    <span className={`mt-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-semibold ${product.dietaryType === "veg" ? "border-green-600 text-green-700" : product.dietaryType === "nonveg" ? "border-red-600 text-red-700" : "border-amber-500 text-amber-700"}`}>
                                        <span className={`inline-block h-2 w-2 rounded-full ${product.dietaryType === "veg" ? "bg-green-600" : product.dietaryType === "nonveg" ? "bg-red-600" : "bg-amber-500"}`} />
                                        {product.dietaryType === "veg" ? "VEG" : product.dietaryType === "nonveg" ? "NON-VEG" : "TYPE NOT SET"}
                                    </span>
                                    <p className="mt-2 text-sm text-gray-500">
                                        {product.description}
                                    </p>

                                    <p className="mt-3 text-sm font-medium text-gray-600">
                                        {product.category}
                                    </p>
                                    <div className="mt-4">
                                        {product.available ? (
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-600">
                                                ● Available
                                            </span>
                                        ) : (
                                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-600">
                                                ● Unavailable
                                            </span>
                                        )}
                                    </div>
                                    {product.available ? (
                                        <button
                                            type="button"
                                            onClick={() => addToCart(product)}
                                            className="mt-5 w-full rounded-xl bg-red-500 py-3 font-semibold text-white transition hover:bg-red-600"
                                        >
                                            Add to Cart
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            disabled
                                            className="mt-5 w-full cursor-not-allowed rounded-xl bg-gray-300 py-3 font-semibold text-gray-500"
                                        >
                                            Currently Unavailable
                                        </button>
                                    )}

                                </div>

                            </div>
                        ))}

                    </div>
                    )}
                    </>
                )}
                <section className="mt-12">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                        Customer Reviews
                        </h2>

                        {totalReviews > 0 && (
                        <p className="mt-1 text-gray-500">
                            ⭐ {averageRating} average rating from {totalReviews} reviews
                        </p>
                        )}
                    </div>

                    {reviews.length === 0 ? (
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
                        <p className="text-gray-500">
                            No reviews yet. Be the first to review this restaurant!
                        </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                            key={review._id}
                            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                            >
                            <div className="flex items-center justify-between">
                                <div>
                                <h3 className="font-semibold text-gray-900">
                                    {review.customerId?.name || "Customer"}
                                </h3>

                                <div className="mt-1">
                                    {Array.from({ length: 5 }).map((_, index) => (
                                    <span key={index}>
                                        {index < review.rating ? "⭐" : "☆"}
                                    </span>
                                    ))}
                                </div>
                                </div>

                                <span className="text-xs text-gray-400">
                                {new Date(review.createdAt).toLocaleDateString()}
                                </span>
                            </div>

                            <p className="mt-3 text-gray-600">
                                {review.comment}
                            </p>
                            </div>
                        ))}
                        </div>
                    )}
                    </section>
            </main>

        </div>
    );
};

export default ViewRestaurant;