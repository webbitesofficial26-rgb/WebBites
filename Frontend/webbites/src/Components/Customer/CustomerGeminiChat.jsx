import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import apiClient from "../../config/apiClient";

const suggestions = [
    "Give me a summary of my recent orders.",
    "How many of my orders are still in progress?",
    "How much have I spent on delivered orders?",
    "How do I track or cancel an order?",
];

const isCustomerToken = () => {
    // The login flow stores the role in localStorage.user. Check that first,
    // then fall back to the signed JWT payload for older sessions.
    try {
        const token = localStorage.getItem("token");
        if (!token) return false;

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                if (user?.role) {
                    return user.role === "customer";
                }
            } catch {
                // Continue to check the token if stored user data is invalid.
            }
        }

        const payloadPart = token.split(".")[1];
        if (!payloadPart) return false;
        const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
        const payload = JSON.parse(atob(paddedBase64));
        return payload.role === "customer" && (!payload.exp || payload.exp * 1000 > Date.now());
    } catch {
        return false;
    }
};

const CustomerGeminiChat = () => {
    const location = useLocation();
    const [isCustomer, setIsCustomer] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! I'm your WebBites customer assistant. I can help explain the website and summarize your own order history. I can't change or cancel orders for you." },
    ]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const customer = isCustomerToken();
        const restrictedPanel = /^\/(admin|restaurant|delivery)(\/|$)/i.test(location.pathname);
        setIsCustomer(customer && !restrictedPanel);
        if (!customer || restrictedPanel) setIsOpen(false);
    }, [location.pathname]);

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            inputRef.current?.focus();
        }
    }, [isOpen, messages, isSending]);

    const sendMessage = async (value = input) => {
        const message = value.trim();
        if (!message || isSending) return;
        setMessages((current) => [...current, { role: "user", text: message }]);
        setInput("");
        setError("");
        setIsSending(true);

        try {
            const token = localStorage.getItem("token");
            const response = await apiClient.post("/api/customer/chat", { message }, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data?.status === 1 && response.data.answer) {
                setMessages((current) => [...current, { role: "assistant", text: response.data.answer }]);
            } else {
                setError(response.data?.message || "Unable to get a response. Please try again.");
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || "Unable to reach the assistant. Check your connection and try again.");
        } finally {
            setIsSending(false);
        }
    };

    if (!isCustomer) return null;

    return (
        <>
            {isOpen && (
                <section className="fixed bottom-24 right-4 z-50 flex h-[min(620px,75vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:right-6" aria-label="WebBites customer AI assistant">
                    <header className="flex items-center justify-between bg-gray-950 px-4 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-bold">W</div>
                            <div>
                                <h2 className="font-bold">WebBites Assistant</h2>
                                <p className="text-xs text-gray-300">Powered by Gemini · Customer help</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg px-3 py-2 text-xl leading-none text-gray-300 hover:bg-gray-800 hover:text-white" aria-label="Close assistant">×</button>
                    </header>

                    <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4" aria-live="polite">
                        {messages.map((item, index) => (
                            <div key={`${index}-${item.role}`} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-3 text-sm leading-6 ${item.role === "user" ? "rounded-br-md bg-red-500 text-white" : "rounded-bl-md border border-gray-200 bg-white text-gray-800"}`}>
                                    {item.text}
                                </div>
                            </div>
                        ))}
                        {isSending && <div className="w-fit rounded-2xl rounded-bl-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">Thinking…</div>}
                        {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                        {messages.length === 1 && (
                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Try asking</p>
                                {suggestions.map((suggestion) => (
                                    <button key={suggestion} type="button" onClick={() => sendMessage(suggestion)} disabled={isSending} className="block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-sm text-gray-700 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50">{suggestion}</button>
                                ))}
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>

                    <form onSubmit={(event) => { event.preventDefault(); sendMessage(); }} className="border-t border-gray-200 bg-white p-3">
                        <div className="flex items-end gap-2 rounded-xl border border-gray-300 p-2 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100">
                            <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} maxLength={1000} placeholder="Ask about WebBites…" className="max-h-24 min-h-9 flex-1 resize-y border-0 px-1 py-2 text-sm outline-none focus:ring-0" aria-label="Message the customer assistant" />
                            <button type="submit" disabled={!input.trim() || isSending} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">Send</button>
                        </div>
                        <p className="mt-2 text-center text-[11px] text-gray-400">Read-only assistant. Use My Orders to manage your orders.</p>
                    </form>
                </section>
            )}
            <button type="button" onClick={() => setIsOpen((open) => !open)} className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-red-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 sm:right-6" aria-expanded={isOpen} aria-label={isOpen ? "Close WebBites assistant" : "Open WebBites assistant"}>
                <span aria-hidden="true" className="text-lg">✦</span>{isOpen ? "Close assistant" : "Ask WebBites AI"}
            </button>
        </>
    );
};

export default CustomerGeminiChat;
