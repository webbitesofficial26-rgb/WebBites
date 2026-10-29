import { useEffect, useRef, useState } from "react";
import apiClient from "../../config/apiClient";

const suggestions = [
    "Give me a quick summary of my restaurant.",
    "How many orders are pending or completed?",
    "Summarize my sales and delivered revenue.",
    "How can I manage my menu and offers?",
];

const RestaurantGeminiChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hi! I'm your WebBites restaurant assistant. I can explain restaurant tools and summarize your own restaurant's orders, menu, and sales. I can't change your data." },
    ]);
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const bottomRef = useRef(null);
    const inputRef = useRef(null);

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
            const response = await apiClient.post("/api/restaurant/chat", { message }, {
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

    return (
        <>
            {isOpen && (
                <section className="fixed bottom-24 right-4 z-50 flex h-[min(620px,75vh)] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:right-6" aria-label="WebBites restaurant AI assistant">
                    <header className="flex items-center justify-between bg-gray-950 px-4 py-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500 text-lg font-bold">W</div>
                            <div>
                                <h2 className="font-bold">WebBites Assistant</h2>
                                <p className="text-xs text-gray-300">Powered by Gemini · Restaurant assistant</p>
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
                            <textarea ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} rows={1} maxLength={1000} placeholder="Ask about WebBites…" className="max-h-24 min-h-9 flex-1 resize-y border-0 px-1 py-2 text-sm outline-none focus:ring-0" aria-label="Message the restaurant assistant" />
                            <button type="submit" disabled={!input.trim() || isSending} className="rounded-lg bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40">Send</button>
                        </div>
                        <p className="mt-2 text-center text-[11px] text-gray-400">Read-only assistant. Verify important figures in your dashboard.</p>
                    </form>
                </section>
            )}
            <button type="button" onClick={() => setIsOpen((open) => !open)} className="fixed bottom-5 right-4 z-50 flex items-center gap-2 rounded-full bg-red-500 px-5 py-3.5 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 sm:right-6" aria-expanded={isOpen} aria-label={isOpen ? "Close WebBites assistant" : "Open WebBites assistant"}>
                <span aria-hidden="true" className="text-lg">✦</span>{isOpen ? "Close assistant" : "Ask WebBites AI"}
            </button>
        </>
    );
};

export default RestaurantGeminiChat;
