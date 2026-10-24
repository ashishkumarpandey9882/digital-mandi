import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import BackButton from "../components/BackButton";
import "./AIAssistant.css";

const API_BASE = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

const SUGGESTIONS = [
  "Mujhe gehun ka MSP batao",
  "Mere latest order ka status kya hai?",
  "Government schemes ke baare mein batao",
  "Mujhe support ticket banana hai",
];

function AIAssistant() {
  const { token } = useAuth();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendMessage(text = input) {
    const content = text.trim();

    if (!content || loading) return;

    if (!token) {
      setError("AI Assistant use karne ke liye pehle login karein.");
      return;
    }

    const updatedMessages = [
      ...messages,
      { role: "user", content },
    ];

    setMessages(updatedMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: updatedMessages.slice(-8),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "AI Assistant se response nahi mila."
        );
      }

      if (typeof data.reply !== "string") {
        throw new Error("AI response ka format sahi nahi hai.");
      }

      setMessages((previous) => [
        ...previous,
        { role: "assistant", content: data.reply },
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Connection issue. Kuch der baad dobara try karein."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <main className="ai-page">

      {/* BACK BUTTON */}
      <div className="ai-back-row">
        <BackButton
          fallback="/farmer-dashboard"
          label="Back to Dashboard"
        />
      </div>

      <section className="ai-shell">
        <header className="ai-header">
          <div className="ai-avatar">✳</div>
          <div>
            <h1>AI Farmer Assistant</h1>
            <p>Digital Mandi · Hindi & Hinglish support</p>
          </div>
          <span className="ai-status">
            <span /> Assistant
          </span>
        </header>

        <div className="ai-chat" aria-live="polite">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">🌾</div>
              <h2>Namaste! Aaj main aapki kya madad kar sakta hoon?</h2>
              <p>
                MSP rates, orders, payment status aur government
                schemes ke baare mein pooch sakte hain.
              </p>

              <div className="ai-suggestions">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => sendMessage(suggestion)}
                    disabled={loading}
                  >
                    {suggestion}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="ai-messages">
              {messages.map((message, index) => (
                <div
                  key={`${index}-${message.role}`}
                  className={`ai-message ${
                    message.role === "user"
                      ? "ai-user-message"
                      : "ai-assistant-message"
                  }`}
                >
                  {message.role === "assistant" && (
                    <span className="ai-message-icon">✳</span>
                  )}
                  <div className="ai-message-content">
                    <span className="ai-message-label">
                      {message.role === "user" ? "Aap" : "AI Assistant"}
                    </span>
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="ai-typing">
                  <span />
                  <span />
                  <span />
                  <p>Assistant jawab taiyar kar raha hai...</p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="ai-error" role="alert">
              {error}
            </div>
          )}
        </div>

        <form className="ai-composer" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                handleSubmit(event);
              }
            }}
            placeholder="Apna sawal yahan likhein..."
            aria-label="Apna sawal likhein"
            rows={2}
            maxLength={2000}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
          >
            {loading ? "..." : "↑"}
          </button>
          <small>Enter to send · Shift + Enter for new line</small>
        </form>

        <footer className="ai-disclaimer">
          AI ke jawab mein galti ho sakti hai. MSP aur scheme details
          ko official sources se verify karein.
        </footer>
      </section>
    </main>
  );
}

export default AIAssistant;