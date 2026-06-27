import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import PlusIcon from "../icons/PlusIcon";
import ShareIcon from "../icons/ShareIcon";
import Card from "../components/Card";
import CreatContentModal from "../components/CreatContentModal";
import SideBar from "../components/Sidebar";
import { api } from "../api/client";
import type { Item, ItemType } from "../types/item";

function Dashboard() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [filter, setFilter] = useState<ItemType | "all">("all");
  const [loading, setLoading] = useState(true);
  const [shareMessage, setShareMessage] = useState("");

  const fetchItems = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }

    setLoading(true);
    try {
      const params = filter === "all" ? {} : { type: filter };
      const response = await api.get("/api/v1/items", { params });
      setItems(response.data.items);
    } catch {
      navigate("/signin");
    } finally {
      setLoading(false);
    }
  }, [filter, navigate]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function shareBrain() {
    try {
      const response = await api.post("/api/v1/brain/share", { share: true });
      setShareMessage(`Share link: ${response.data.path}`);
    } catch {
      setShareMessage("Could not create share link");
    }
  }

  return (
    <div>
      <SideBar activeFilter={filter} onFilterChange={setFilter} />
      <div className="p-4 ml-72 min-h-screen bg-gray-100 border-2">
        <CreatContentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSaved={fetchItems}
        />

        <div className="flex justify-end gap-4 mb-6">
          <Button
            onClick={() => setModalOpen(true)}
            variant="primary"
            text="Add Content"
            startIcon={<PlusIcon />}
          />
          <Button
            onClick={shareBrain}
            variant="secondary"
            text="Share Brain"
            startIcon={<ShareIcon />}
          />
        </div>

        {shareMessage && (
          <p className="text-sm text-purple-700 mb-4 bg-purple-50 p-3 rounded">
            {shareMessage}
          </p>
        )}

        {loading ? (
          <p className="text-gray-500">Loading your brain...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg">Nothing saved yet</p>
            <p className="text-sm mt-2">Add a link, video, tweet, or note to get started.</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {items.map((item) => (
              <Card
                key={item._id}
                itemType={item.type}
                title={item.title}
                link={item.link || item.rawContent}
                summary={item.summary}
                tags={item.tags}
                aiProcessed={item.aiProcessed}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
