import { Link, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const pageContent = {
  "/help-center": {
    title: "Help Center",
    description: "Welcome to the WebBites Help Center.",
    body: "Find help with browsing restaurants, placing orders, managing your account, tracking deliveries, and understanding payment options. If you need further assistance, please visit our Contact Us page.",
  },
  "/contact": {
    title: "Contact Us",
    description: "We are here to help.",
    body: "For questions about your account, orders, restaurants, delivery, or payments, contact the WebBites support team. Please include your order details when asking about a specific order.",
  },
  "/privacy-policy": {
    title: "Privacy Policy",
    description: "Your privacy matters to WebBites.",
    body: "WebBites uses account and order information to provide food ordering, payment, and delivery services. Account information should only be accessed by authorized users and used for purposes related to operating the service. This sample policy should be reviewed and updated to reflect the application's actual data practices before public launch.",
  },
  "/terms-and-conditions": {
    title: "Terms & Conditions",
    description: "Please use WebBites responsibly.",
    body: "By using WebBites, customers agree to provide accurate account and delivery details and to use the platform lawfully. Orders are subject to restaurant availability, the displayed prices, and the selected payment method. This sample text is for the project demonstration and should be reviewed before the website is launched publicly.",
  },
};

export default function SupportPage() {
  const { pathname } = useLocation();
  const page = pageContent[pathname] || pageContent["/help-center"];

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex flex-1 items-start justify-center px-4 py-14 sm:py-20">
        <section className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-7 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-wider text-red-500">WebBites Support</p>
          <h1 className="mt-3 text-3xl font-extrabold text-gray-900 sm:text-4xl">{page.title}</h1>
          <p className="mt-4 text-lg text-gray-700">{page.description}</p>
          <p className="mt-5 leading-7 text-gray-600">{page.body}</p>

          {pathname === "/help-center" && (
            <div className="mt-8 border-t border-gray-200 pt-5 text-sm text-gray-600">
              <p>For further help, email us at:</p>
              <a
                href="mailto:webbitesofficial26@gmail.com"
                className="mt-1 inline-block font-semibold text-red-600 hover:text-red-700 hover:underline"
              >
                webbitesofficial26@gmail.com
              </a>
            </div>
          )}

          {pathname === "/contact" && (
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h2 className="font-semibold text-gray-900">Email Support</h2>
                <a
                  href="mailto:webbitesofficial26@gmail.com"
                  className="mt-2 inline-block break-all text-red-600 hover:underline"
                >
                  webbitesofficial26@gmail.com
                </a>
                <p className="mt-2 text-sm text-gray-500">For orders, accounts, restaurant, delivery, and payment queries.</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                <h2 className="font-semibold text-gray-900">Phone Support</h2>
                <p className="mt-2 text-gray-700">Not available yet</p>
                <p className="mt-2 text-sm text-gray-500">Please contact us by email for now.</p>
              </div>
            </div>
          )}

          <Link to="/" className="mt-8 inline-flex rounded-lg bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-600">Back to Home</Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
