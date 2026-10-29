

## Stage 31 — Whole-number cart quantities

- Tightened `getPositiveQuantity` in `Frontend/webbites/src/Components/Context/CartContext.jsx` so cart quantity calculations use positive whole numbers, as expected for individual food items.
- Fractional, non-finite, zero, and negative values no longer propagate into cart count or total calculations; valid whole-number quantities and numeric strings continue to work.
- Existing cart UI, API endpoints, product pricing, and checkout flow were not intentionally changed.
- Validation: source replacement and ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then test add/increase/decrease/remove and cart totals.


## Stage 33 — Guard against non-finite cart totals

- Updated `Context/CartContext.jsx` to check both each item's computed subtotal and the accumulated cart total before accepting the calculation.
- Extreme or malformed runtime values that would produce `Infinity` are ignored rather than contaminating the displayed cart total.
- Normal valid prices and whole-number quantities retain the existing calculation behavior; no UI, API, or checkout logic was changed.
- Validation: source replacement and ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then test normal cart totals and quantity changes.


## Stage 34 — Guard against non-finite cart counts

- Cart-count accumulation now ignores a next count if malformed/extreme quantity values would make it non-finite.
- Normal quantity operations and existing UI/API/checkout behavior are unchanged.
- Validation: ZIP integrity checked; frontend build not run here.

## Stage 35 — Improve restaurant listing feedback

- Updated `Customer/Rest.jsx` to show a simple loading message, an error message if the restaurant request fails, and an empty-state message when no restaurants are returned.
- Restaurant cards now use `restaurant.image` when available, with the existing restaurant photo kept as a fallback. This lets restaurants with their own image display it without requiring backend changes.
- Existing routes, API endpoint, restaurant status behavior, and card layout are unchanged.
- Validation: source was inspected and ZIP integrity will be checked; a fresh frontend build was not run in this environment. Please run `npm ci` and `npm run build` in `Frontend/webbites`, then check the restaurant list with available and empty/error API results.


## Stage 36 — Fallback for broken restaurant images

- Restaurant cards now switch to the existing fallback restaurant photo if a restaurant image URL fails to load.
- The error handler disables itself before switching the image, preventing repeated fallback attempts if the fallback URL also fails.
- No backend, routes, API behavior, or restaurant card layout changes.
- Validation: source replacement and ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then check a restaurant with a broken image URL.


## Stage 37 — Add a retry option to the restaurant listing

- Added a **Try Again** button for restaurant request errors; it retries the existing API request and restores the loading message.
- No backend, route, or restaurant-card behavior changes.
- Validation: ZIP integrity checked; frontend build not run here.


## Stage 38 — Search restaurants by name or address

- Added a small search field to the customer restaurant listing. It filters the already-loaded restaurant list by restaurant name or address as the user types.
- Shows a clear message when no restaurants match the entered search. Clearing the search restores the full list.
- No backend endpoint, routes, or restaurant ordering behavior changed.
- Validation: ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then test searches by name/address and clearing the field.


## Stage 39 — Filter to open restaurants

- Added a simple “Show open restaurants only” checkbox to the customer restaurant listing. It works together with the existing name/address search and filters the already-loaded list without another API request.
- Displays a helpful message when no restaurants match the active search and filter. The checkbox is off by default, so the existing listing behavior stays the same until selected.
- No backend, route, ordering, or restaurant-status logic was changed.
- Validation: ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then test the checkbox with both open and closed restaurants.

## Stage 40 — Clear restaurant search and filters

- Added a “Clear search and filters” button on the customer restaurant listing when a search term or open-only filter is active.
- Clicking it clears the search field and turns off the open-only checkbox, restoring the full restaurant list. The button is hidden when no filters are active.
- No backend, routes, API calls, or restaurant ordering behavior changed.
- Validation: ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then test the button with search, filter, and both active together.


## Stage 41 — Sort restaurants by name

- Added a small sort dropdown to the customer restaurant listing: default order, restaurant name A–Z, or Z–A.
- Sorting works together with the existing search and open-only filter and uses the already-loaded restaurant list, so it does not add API requests or packages.
- The existing clear button also resets sorting to the default order.


## Stage 42 — Handle unsuccessful restaurant API responses

- Updated the customer restaurant listing to show its existing error message and “Try Again” button when the API returns an unsuccessful status or an unexpected non-array data value.
- Previously, those responses could leave the list empty and incorrectly display “No restaurants are available,” which is intended for a successful empty result.
- No backend, route, dependency, or restaurant ordering logic was changed.
- Validation: ZIP integrity checked and the changed JSX source was inspected. A fresh frontend build was not run here; run `npm ci` and `npm run build` in `Frontend/webbites`, then test both a successful empty response and a failed API response if practical.


## Stage 43 — Show restaurant result count

- Added a small live result count to the customer restaurant listing, showing how many restaurants match the current search and open-only filter out of the total loaded restaurants.
- The count updates as the customer types or changes the filter, and handles singular/plural wording.
- No backend, API, route, dependency, or ordering behavior was changed.
- Validation: ZIP integrity checked and the JSX change was inspected. A fresh frontend build was not run here; run `npm ci` and `npm run build` in `Frontend/webbites`, then test the count with search and filters.


## Stage 44 — Handle restaurant menu loading errors

- Updated `Customer/ViewRestaurant.jsx` to show a clear error message if the restaurant, menu, or review request fails instead of leaving the page looking like an empty menu.
- Added a simple **Try Again** button and a link back to the restaurant list.
- Existing endpoints and normal menu/cart/review behavior are unchanged.
- Validation: source inspection and ZIP integrity check; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then open a restaurant menu to check normal loading.


## Stage 46 — Keep one restaurant per cart
- Prevents items from different restaurants being mixed into one order, since checkout uses the first cart item's restaurant ID for the order.
- If a customer adds food from another restaurant, a simple confirmation asks whether to clear the current cart and replace it with the new item.
- Declining the confirmation leaves the cart unchanged. No backend or dependency changes.


## Stage 47 — Clear the cart from the cart page

- Added a **Clear Cart** button to the customer cart page. It asks for confirmation before removing all items, helping customers restart an order without removing items one by one.
- Reuses the existing `clearCart` function in `CartContext`; no backend, route, dependency, or checkout logic changed.
- Validation: ZIP integrity checked and the changed JSX inspected. A fresh frontend build was not run here; run `npm ci` and `npm run build` in `Frontend/webbites`, then test both confirming and cancelling the prompt.

## Stage 48 — Keep cart items after refresh

- Saves the customer's cart in browser local storage and restores it when WebBites is reopened or refreshed.
- Uses a simple fallback to an empty cart if saved data is missing or unreadable.
- No backend, checkout, route, or dependency changes.
- Validation: ZIP integrity checked and the changed source inspected; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then add an item, refresh, and verify the cart remains.


## Stage 51 — Clear customer order loading errors
- The My Orders page now distinguishes a failed order request from a successful request that returns no orders.
- Adds a simple Try Again action when orders cannot initially be loaded. If a later refresh fails, previously loaded orders remain visible with a small retry message.
- Keeps the existing order status timeline, cancellation, reviews, return requests, and 10-second refresh behavior unchanged. No backend, route, or dependency changes.
- Validation: ZIP integrity checked and changed JSX inspected. A fresh frontend build was not run here; run `npm ci` and `npm run build` in `Frontend/webbites`, then test My Orders with the backend running and, if possible, temporarily unavailable.


## Stage 53 — Copy customer order ID
- Added a small **Copy ID** button beside each order number on the My Orders page, so a customer can quickly copy an order ID when asking for help.
- The button briefly changes to **Copied!** after a successful copy. Existing order details, status filters, tracking, cancellation, reviews, and returns remain unchanged.
- No backend, API, route, or dependency changes. Validation: changed JSX inspected and ZIP integrity checked; a fresh frontend build was not run here.


## Stage 54 – My Orders item count
- Added a small item-count label to each order’s Ordered Items section, using the existing order items data. No API or order behavior changed.


## Stage 55 — Show payment details in My Orders

- My Orders now displays the payment method (Online Payment or Cash on Delivery) and payment status beneath the order total.
- Uses the existing order fields; no API or payment processing changes were made.
- Validation: source change and ZIP integrity checked; a fresh frontend build was not run here. Run `npm ci` and `npm run build` in `Frontend/webbites`, then check orders created with both payment methods.


## Stage 56 — Show newest orders first

The My Orders list is sorted by order creation date, newest first, before the selected status filter is applied. This keeps recent orders easy to find without changing the API or order actions.


## Stage 57 — Order date fallback
- The My Orders page now shows “Order date unavailable” if an order has a missing or invalid creation date, instead of displaying an invalid date string.
- No API or order-processing behavior changed.
