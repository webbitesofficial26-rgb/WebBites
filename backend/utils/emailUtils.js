import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
    apiKey: process.env.BREVO_API_KEY,
});

// Prevent HTML characters in customer data from being interpreted as markup.
const escapeHtml = (value = "") =>
    String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[char]);

const sendEmail = async ({
    to,
    name,
    subject,
    message,
    details = [],
    actionUrl,
    actionText = "Continue",
}) => {
    try {
        if (!process.env.BREVO_API_KEY) {
            console.error("Brevo API key is missing");
            return false;
        }

        if (!process.env.BREVO_SENDER_EMAIL) {
            console.error("Brevo sender email is missing");
            return false;
        }

        if (!to) {
            console.error("Recipient email is missing");
            return false;
        }

        const safeName = escapeHtml(name || "Customer");
        const safeMessage = escapeHtml(message || "");

        const detailsHtml = details.length
            ? `
                <div style="background:#f9fafb;padding:16px;
                            border-radius:8px;margin:20px 0;">
                    ${details.map((item) => `
                        <p style="margin:8px 0;color:#374151;">
                            <strong>${escapeHtml(item.label)}:</strong>
                            ${escapeHtml(item.value)}
                        </p>
                    `).join("")}
                </div>
            `
            : "";

        await brevo.transactionalEmails.sendTransacEmail({
            sender: {
                name: process.env.BREVO_SENDER_NAME || "WebBites",
                email: process.env.BREVO_SENDER_EMAIL,
            },

            to: [
                {
                    email: to,
                    name: name || "Customer",
                },
            ],

            subject,

            htmlContent: `
                <div style="font-family:Arial,sans-serif;
                            max-width:600px;margin:auto;padding:24px;
                            color:#333;line-height:1.6;">

                    <h2 style="color:#ea580c;">WebBites</h2>

                    <h3>Hello ${safeName}!</h3>

                    <p>${safeMessage}</p>

                    ${detailsHtml}
                    ${actionUrl ? `
                        <div style="text-align:center;margin:24px 0;">
                            <a href="${escapeHtml(actionUrl)}"
                            style="background:#ea580c;color:#ffffff;
                                    padding:12px 24px;text-decoration:none;
                                    border-radius:6px;display:inline-block;">
                                ${escapeHtml(actionText)}
                            </a>
                        </div>
                    ` : ""}
                    <p>Thank you for choosing WebBites!</p>

                    <hr style="border:none;border-top:1px solid #eee;">

                    <p style="font-size:12px;color:#777;">
                        This is an automated email from WebBites.
                    </p>
                </div>
            `,
        });

        console.log(`Email sent successfully to ${to}`);
        return true;

    } catch (error) {
        console.error("Brevo email error:", error.message);
        return false;
    }
};

export default sendEmail;