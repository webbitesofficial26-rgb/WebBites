import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-12 lg:px-10">

        {/* Main Footer */}
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">

          {/* Brand */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Web<span className="text-red-500">Bites</span>
            </h2>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">
              Your friendly neighborhood food delivery platform.
              Discover great food and get it delivered to your doorstep.
            </p>

            {/* Social Links */}
            <div className="mt-6 flex gap-3">
              <Link
                to="#"
               
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm font-bold text-gray-300 transition-all duration-300 hover:-translate-y-1 hover:bg-red-500 hover:text-white"
              >
                f
              </Link>

              <Link
                to="#"
                
                aria-label="X"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm font-bold text-gray-300 transition-all duration-300 hover:-translate-y-1 hover:bg-red-500 hover:text-white"
              >
                X
              </Link>

              <Link
                to="#"
                
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-sm font-bold text-gray-300 transition-all duration-300 hover:-translate-y-1 hover:bg-red-500 hover:text-white"
              >
                I
              </Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h3>

            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <Link
                  to="/help-center"
                  className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-red-400"
                >
                  Help Center
                </Link>
              </li>

              <li>
                <Link
                  to="/contact"
                  className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-red-400"
                >
                  Contact Us
                </Link>
              </li>

              <li>
                <Link
                  to="/privacy-policy"
                  className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-red-400"
                >
                  Privacy Policy
                </Link>
              </li>

              <li>
                <Link
                  to="/terms-and-conditions"
                  className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-red-400"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact / Short Info */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              WebBites
            </h3>

            <p className="mt-5 max-w-xs text-sm leading-6 text-gray-400">
              Great food, delivered to your doorstep. Fast, simple, and
              convenient.
            </p>
          </div>

        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-gray-800 pt-6">
          <div className="flex flex-col items-center justify-between gap-3 text-center text-sm text-gray-500 md:flex-row md:text-left">

            <p>
              © {new Date().getFullYear()} WebBites. All rights reserved.
            </p>

            <p>
              Made with <span className="text-red-500">♥</span> for food lovers.
            </p>

          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;