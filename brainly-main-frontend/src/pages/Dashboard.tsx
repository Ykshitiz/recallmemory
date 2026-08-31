import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PlusIcon from "../icons/PlusIcon";
import ShareIcon from "../icons/ShareIcon";
import Card from "../components/Card";
import CreatContentModal from "../components/CreatContentModal";
import SideBar from "../components/Sidebar";
import BrainChat from "../components/BrainChat";
import { api } from "../api/client";
import type { Item, ItemType } from "../types/item";

function Dashboard() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<ItemType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [shareMessage, setShareMessage] = useState("");

  const fetchItems = useCallback(async (silent = false) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    try {
      const params: Record<string, string> = {};
      if (filter !== "all") params.type = filter;
      if (searchQuery.trim()) {
        params.q = searchQuery.trim();
        params.semantic = "true";
      }
      if (selectedTag) params.tag = selectedTag;
      const response = await api.get("/api/v1/items", { params });
      setItems(response.data.items);
      setSelectedItem((current) =>
        current
          ? response.data.items.find((item: Item) => item._id === current._id) || null
          : null
      );
      setErrorMessage("");
    } catch (error: any) {
      if (error.response?.status === 401) {
        navigate("/signin");
      } else {
        setErrorMessage("Could not load your saved content. Please try again.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [filter, navigate, searchQuery, selectedTag]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const availableTags = Array.from(
    new Set(items.flatMap((item) => item.tags || []))
  ).sort((a, b) => a.localeCompare(b));

  const hasPendingAi = items.some(
    (item) =>
      !item.aiProcessed ||
      item.embeddingStatus === "pending" ||
      item.embeddingStatus === "processing"
  );

  useEffect(() => {
    if (!hasPendingAi) {
      return;
    }

    const interval = setInterval(() => {
      fetchItems(true);
    }, 3000);

    return () => clearInterval(interval);
  }, [hasPendingAi, fetchItems]);

  async function shareBrain() {
    try {
      const response = await api.post("/api/v1/brain/share", { share: true });
      setShareMessage(`Share link: ${response.data.path}`);
    } catch {
      setShareMessage("Could not create share link");
    }
  }

  async function reprocessItem(item: Item) {
    try {
      await api.post(`/api/v1/items/${item._id}/reprocess`);
      setSelectedItem(null);
      await fetchItems(true);
    } catch {
      setErrorMessage("Could not restart AI processing. Please try again.");
    }
  }

  async function reprocessEmbeddings() {
    try {
      const response = await api.post("/api/v1/items/embeddings/reprocess");
      setShareMessage(
        response.data.queued
          ? `Generating semantic-search embeddings for ${response.data.queued} item(s)...`
          : "All currently loaded items already have semantic-search embeddings."
      );
      await fetchItems(true);
    } catch {
      setErrorMessage("Could not start embedding generation. Please try again.");
    }
  }

  async function viewSource(itemId: string) {
    const item = items.find((savedItem) => savedItem._id === itemId);
    if (item) {
      setSelectedItem(item);
      return;
    }

    try {
      const response = await api.get(`/api/v1/items/${itemId}`);
      setSelectedItem(response.data.item);
    } catch {
      setErrorMessage("Could not open the selected source.");
    }
  }

  return (
    <div>
      <SideBar activeFilter={filter} onFilterChange={setFilter} />
      <main className="min-h-screen bg-slate-50 px-4 py-6 lg:ml-72 lg:px-10 lg:py-10">
        <CreatContentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={fetchItems}
        />

        {selectedItem && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="item-details-title"
            onMouseDown={() => setSelectedItem(null)}
          >
            <div
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm capitalize text-gray-500">{selectedItem.type}</p>
                  <h2 id="item-details-title" className="text-xl font-semibold text-gray-900">
                    {selectedItem.title}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-500 hover:text-gray-900"
                  aria-label="Close item details"
                >
                  Close
                </button>
              </div>

              {!selectedItem.aiProcessed && (
                <p className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-700">
                  AI processing is still pending. This view will update once processing finishes.
                </p>
              )}

              {selectedItem.processingStatus === "completed" && (
                <p className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-700">
                  This summary and tags were generated by Groq AI.
                </p>
              )}

              {selectedItem.processingStatus === "fallback" && (
                <div className="mt-4 rounded bg-amber-50 p-3 text-sm text-amber-800">
                  <p>This is a basic preview, not an LLM-generated summary.</p>
                  <p className="mt-1">{selectedItem.processingError || "Configure a valid Groq key, then reprocess this item."}</p>
                </div>
              )}

              {selectedItem.processingStatus === "failed" && (
                <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">
                  <p>{selectedItem.processingError || "AI processing failed."}</p>
                </div>
              )}

              {selectedItem.embeddingStatus === "completed" && (
                <p className="mt-3 rounded bg-blue-50 p-3 text-sm text-blue-800">
                  Semantic-search embedding is ready.
                </p>
              )}

              {selectedItem.embeddingStatus === "unavailable" && (
                <p className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-800">
                  Semantic-search embedding is unavailable: {selectedItem.embeddingError || "add GEMINI_API_KEY and reprocess embeddings."}
                </p>
              )}

              {(selectedItem.processingStatus === "fallback" || selectedItem.processingStatus === "failed") && (
                <button
                  type="button"
                  onClick={() => reprocessItem(selectedItem)}
                  className="mt-3 rounded bg-purple-600 px-3 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Reprocess with AI
                </button>
              )}

              {selectedItem.summary && (
                <section className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900">Generated summary</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">
                    {selectedItem.summary}
                  </p>
                </section>
              )}

              {selectedItem.tags.length > 0 && (
                <section className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900">AI tags</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedItem.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setSelectedTag(tag);
                          setSelectedItem(null);
                        }}
                        className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-5">
                <h3 className="text-sm font-semibold text-gray-900">Original saved content</h3>
                {selectedItem.link && selectedItem.type !== "note" ? (
                  <a
                    href={selectedItem.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 block break-all text-sm text-purple-700 underline"
                  >
                    {selectedItem.link}
                  </a>
                ) : (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {selectedItem.rawContent}
                  </p>
                )}
              </section>

              {selectedItem.extractedText && (
                <section className="mt-5">
                  <h3 className="text-sm font-semibold text-gray-900">Extracted text used by AI</h3>
                  <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-sm leading-6 text-gray-700">
                    {selectedItem.extractedText}
                  </p>
                </section>
              )}
            </div>
          </div>
        )}

        <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-sm font-medium text-violet-600">YOUR KNOWLEDGE LIBRARY</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500">Search, revisit, and connect what you have saved.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setModalOpen(true)} variant="primary" text="Add content" startIcon={<PlusIcon />} />
            <Button onClick={shareBrain} variant="secondary" text="Share" startIcon={<ShareIcon />} />
          </div>
        </header>

        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search titles, summaries, and tags..."
              aria-label="Search saved content"
              className="w-80 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            {(searchQuery || selectedTag) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedTag("");
                }}
                className="text-sm font-medium text-violet-700 hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex gap-3">
          <button
            type="button"
            onClick={reprocessEmbeddings}
            className="rounded-xl border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
          >
            Generate embeddings
          </button>
          </div>
        </div>
        </div>

        {availableTags.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Filter by tag:</span>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTag(selectedTag === tag ? "" : tag)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${selectedTag === tag ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-700 hover:bg-violet-200"}`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {shareMessage && (
          <p className="mb-4 rounded-xl border border-violet-100 bg-violet-50 p-3 text-sm text-violet-700">
            {shareMessage}
          </p>
        )}

        {hasPendingAi && (
          <p className="mb-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-700">
            AI is processing your latest saves and semantic-search embeddings...
          </p>
        )}

        {errorMessage && (
          <p className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading your brain...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">{searchQuery || selectedTag ? "No matching items" : "Nothing saved yet"}</p>
            <p className="text-sm mt-2">
              {searchQuery || selectedTag ? "Try a different search or clear your filters." : "Add a link, video, tweet, or note to get started."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {items.map((item) => (
              <Card
                key={item._id}
                itemType={item.type}
                title={item.title}
                link={item.link || item.rawContent}
                summary={item.summary}
                tags={item.tags}
                aiProcessed={item.aiProcessed}
                processingStatus={item.processingStatus}
                onTagClick={setSelectedTag}
                onView={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}

        <BrainChat onViewSource={viewSource} />
      </main>
    </div>
  );
}

export default Dashboard;
