import Razorpay from "razorpay";

export const isRazorpayConfigured = () => {
    const keyId = process.env.RAZORPAY_KEY_ID?.trim();
    const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

    return Boolean(
        keyId &&
        keySecret &&
        keyId !== "rzp_test_your_key_id" &&
        keySecret !== "your_test_key_secret"
    );
};

const razorpay = isRazorpayConfigured()
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    })
    : null;

export default razorpay;
