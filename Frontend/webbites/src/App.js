import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AuthRoute from "./Components/AuthRoute";
import ErrorBoundary from "./Components/ErrorBoundary";
import CustomerGeminiChat from "./Components/Customer/CustomerGeminiChat";

const Home = lazy(() => import("./Components/Customer/Home"));
const Login = lazy(() => import("./Components/Login"));
const Register = lazy(() => import("./Components/Register"));
const ForgetPassword = lazy(() => import("./Components/ForgotPassword"))
const ResetPassword = lazy(() => import("./Components/ResetPassword"))
const AccountForgotPassword = lazy(() => import("./Components/AccountForgotPassword"));
const AccountResetPassword = lazy(() => import("./Components/AccountResetPassword"));

const Admin = lazy(() => import("./Components/Admin/Admin"));
const AdminLogin = lazy(() => import("./Components/Admin/AdminLogin"))
const ManageRestaurants = lazy(() => import("./Components/Admin/ManageRestaurants"))
const ManageCustomers = lazy(() => import("./Components/Admin/ManageCustomers"))
const ManageDelivery = lazy(() => import("./Components/Admin/ManageDelivery"))
const ManageOrders = lazy(() => import("./Components/Admin/ManageOrders"))
const ManageProducts = lazy(() => import("./Components/Admin/ManageProducts"))
const ManageCoupons = lazy(() => import("./Components/Admin/ManageCoupons"))
const ManageOfferTemplates = lazy(() => import("./Components/Admin/ManageOfferTemplates"))
const ManageReturns = lazy(() => import("./Components/Admin/ManageReturns"));
const AdminReports = lazy(() => import("./Components/Admin/AdminReports"));

const Rest = lazy(() => import("./Components/Customer/Rest"));
const ViewRestaurant = lazy(() => import("./Components/Customer/ViewRestaurant"));
const Cart = lazy(() => import("./Components/Customer/Cart"));
const Checkout = lazy(() => import("./Components/Customer/Checkout"));
const MyOrders = lazy(()=> import("./Components/Customer/MyOrders"));
const CustomerProfile = lazy(() => import("./Components/Customer/CustomerProfile"));
const CustomerAddresses = lazy(() => import("./Components/Customer/CustomerAddresses"));
const Offers = lazy(() => import("./Components/Customer/Offers"));
const SupportPage = lazy(() => import("./Components/Customer/SupportPage"));

const Restaurants = lazy(() => import("./Components/Restaurants/Restaurants"));
const RestaurantRegister = lazy(() => import("./Components/Restaurants/Restaurantregister"));
const RestaurantLogin = lazy(() => import("./Components/Restaurants/RestaurantLogin"));
const AddProduct = lazy(() => import("./Components/Restaurants/AddProduct"));
const RestaurantMenu = lazy(() => import("./Components/Restaurants/RestaurantMenu"));
const EditProduct = lazy(() => import("./Components/Restaurants/EditProduct"));
const RestaurantOrders = lazy(() => import("./Components/Restaurants/RestaurantOrders"));
const RestaurantProfile = lazy(() => import("./Components/Restaurants/RestaurantProfile"));
const RestaurantOffers = lazy(() => import("./Components/Restaurants/RestaurantOffers"));

const DeliveryPanel = lazy(() => import("./Components/Delivery/DeliveryPanel"));
const GetDeliveries = lazy(() => import("./Components/Delivery/GetDeliveries"));
const MyDeliveries = lazy(() => import("./Components/Delivery/MyDeliveries"));
const DeliveryRegister = lazy(() => import("./Components/Delivery/DeliveryRegister"));
const DeliveryLogin = lazy(() => import("./Components/Delivery/DeliveryLogin"));
const DeliveryProfile = lazy(() => import("./Components/Delivery/DeliveryProfile"))


function App() {
  return (
    <ErrorBoundary>
    <Suspense fallback={
        <main
          className="flex min-h-screen items-center justify-center bg-gray-50 px-4"
          role="status"
          aria-live="polite"
          aria-label="Loading page"
        >
          <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-8 py-7 shadow-sm">
            <span
              className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-gray-600">Loading WebBites...</p>
          </div>
        </main>
    }>
    <Routes>
      {/* {base routes} */}
      <Route path="/" element={<Home />} />
      <Route path="/help-center" element={<SupportPage />} />
      <Route path="/contact" element={<SupportPage />} />
      <Route path="/privacy-policy" element={<SupportPage />} />
      <Route path="/terms-and-conditions" element={<SupportPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgetPassword/>}/>
      <Route path="/reset-password/:token" element={<ResetPassword/>} />
      <Route path="/restaurant/forgot-password" element={<AccountForgotPassword />} />
      <Route path="/delivery/forgot-password" element={<AccountForgotPassword />} />
      <Route path="/reset-account-password/:accountType/:token" element={<AccountResetPassword />} />

      {/* {admin routes} */}
      <Route path="/admin/" element={<AuthRoute role="admin"><Admin /></AuthRoute>} />
      <Route path="/admin/login" element={<AdminLogin />}/>
      <Route path="/admin/restaurants" element={<AuthRoute role="admin"><ManageRestaurants /></AuthRoute>} />
      <Route path="/admin/customers" element={<AuthRoute role="admin"><ManageCustomers /></AuthRoute>}/>
      <Route path="/admin/delivery" element={<AuthRoute role="admin"><ManageDelivery /></AuthRoute>}/>
      <Route path="/admin/orders" element={<AuthRoute role="admin"><ManageOrders /></AuthRoute>}/>
      <Route path="/admin/products" element={<AuthRoute role="admin"><ManageProducts/></AuthRoute>}/>
      <Route path="/admin/coupons" element={<AuthRoute role="admin"><ManageCoupons /></AuthRoute>}/>
      <Route path="/admin/offer-templates" element={<AuthRoute role="admin"><ManageOfferTemplates /></AuthRoute>}/>
      <Route path="/admin/returns" element={<AuthRoute role="admin"><ManageReturns /></AuthRoute>} />
      <Route path="/admin/reports" element={<AuthRoute role="admin"><AdminReports /></AuthRoute>} />

      {/* {customer routes} */}
      <Route path="/restaurant-menu/:restaurantId" element={<ViewRestaurant />}/>
      <Route path="/cart" element={<AuthRoute role="customer"><Cart /></AuthRoute>}/>
      <Route path="/cust-viewrestaurant" element={<Rest/>}/>
      <Route path="/checkout" element={<AuthRoute role="customer"><Checkout /></AuthRoute>}/>
      <Route path="/my-orders" element={<AuthRoute role="customer"><MyOrders/></AuthRoute>}/>
      <Route path="/customer/profile" element={<AuthRoute role="customer"> <CustomerProfile /> </AuthRoute> }/>
      <Route path="/customer/addresses" element={<AuthRoute role="customer"><CustomerAddresses /></AuthRoute>} />
      <Route path="/offers" element={<Offers />}/>

      {/* {restaurant routes} */}
      <Route path="/restaurant" element={<AuthRoute role="restaurant"><Restaurants /></AuthRoute>} />
      <Route path="/restaurant/register" element={<RestaurantRegister />}/>
      <Route path="/restaurant/login" element={<RestaurantLogin />}/>
      <Route path="/restaurant/menu/add" element={<AuthRoute  role="restaurant"><AddProduct /></AuthRoute>}/>
      <Route path="/restaurant/menu" element={<AuthRoute  role="restaurant"><RestaurantMenu /></AuthRoute>}/>
      <Route path="/restaurant/menu/edit/:id" element={<AuthRoute  role="restaurant"><EditProduct /></AuthRoute>}/>
      <Route path="/restaurant/orders" element={<AuthRoute  role="restaurant"><RestaurantOrders /></AuthRoute>}/>
      <Route path="/restaurant/profile" element={<AuthRoute  role="restaurant"><RestaurantProfile /></AuthRoute>}/>
      <Route path="/restaurant/offers" element={<AuthRoute role="restaurant"><RestaurantOffers /></AuthRoute>}/>

      {/* {delivery routes} */}
      <Route path="/delivery/" element={<AuthRoute role="delivery"><DeliveryPanel /></AuthRoute>} />
      <Route path="/delivery/get-deliveries" element={<AuthRoute role="delivery"><GetDeliveries /></AuthRoute>} />
      <Route path="/delivery/my-deliveries" element={<AuthRoute role="delivery"><MyDeliveries /></AuthRoute>} />
      <Route path="/delivery/register" element={<DeliveryRegister />}/>
      <Route path="/delivery/login" element={<DeliveryLogin />}/>
      <Route path="/delivery/profile" element={<AuthRoute role="delivery"><DeliveryProfile /></AuthRoute>} />
    </Routes>
      <CustomerGeminiChat />
    </Suspense>
    </ErrorBoundary>
  );
}

export default App;