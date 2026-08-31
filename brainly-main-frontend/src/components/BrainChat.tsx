import { useState } from "react";
import { api } from "../api/client";

interface Source {
  _id: string;
  title: string;
  type: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface BrainChatProps {
  onViewSource: (id: string) => void | Promise<void>;
}

export default function BrainChat({ onViewSource }: BrainChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [sending, setSending] = useState(false);

  async function sendQuestion(event: React.FormEvent) {
    event.preventDefault();
    const message = question.trim();
    if (!message || sending) return;

    setQuestion("");
    setMessages((current) => [...current, { role: "user", content: message }]);
    setSending(true);
    try {
      const response = await api.post("/api/v1/chat", { message });
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.data.answer, sources: response.data.sources },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "I couldn't answer right now. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Ask My Brain</h2>
        <p className="mt-1 text-sm text-gray-500">Answers are grounded in your saved, retrieved content.</p>
      </div>

      <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
        {messages.length === 0 && (
          <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">
            Try: “What did I save about authentication?”
          </p>
        )}
        {messages.map((message, index) => (
          <div key={index} className={message.role === "user" ? "ml-8" : "mr-8"}>
            <p className={`rounded-lg p-3 text-sm whitespace-pre-line ${message.role === "user" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-800"}`}>
              {message.content}
            </p>
            {message.sources && message.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.sources.map((source) => (
                  <button
                    key={source._id}
                    type="button"
                    onClick={() => onViewSource(source._id)}
                    className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700 hover:bg-purple-200"
                  >
                    {source.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
        {sending && <p className="text-sm text-gray-500">Searching your brain and writing an answer…</p>}
      </div>

      <form onSubmit={sendQuestion} className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about anything you saved..."
          maxLength={1000}
          className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        <button
          type="submit"
          disabled={sending || !question.trim()}
          className="rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-purple-300"
        >
          Ask
        </button>
      </form>
    </section>
  );
}
