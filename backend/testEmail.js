import "dotenv/config";
import sendEmail from "./utils/emailUtils.js";

const recipient = process.env.EMAIL_TEST_RECIPIENT?.trim();
if (!recipient) {
    console.error("Set EMAIL_TEST_RECIPIENT in backend/.env before running the email test.");
    process.exitCode = 1;
} else {
    const sent = await sendEmail({
        to: recipient,
        name: "WebBites Tester",
        subject: "WebBites Email Test",
        message: "This is a test of the WebBites transactional email configuration.",
    });
    if (!sent) process.exitCode = 1;
}
