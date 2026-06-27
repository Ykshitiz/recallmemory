import { useRef, useState } from "react";
import CrossIcon from "../icons/CrossIcon";
import Button from "./Button";
import { Input } from "./Input";
import { api } from "../api/client";

type ContentType = "youtube" | "twitter" | "note" | "link";

interface CreatContentModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CreatContentModal = ({ open, onClose, onSaved }: CreatContentModalProps) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [type, setType] = useState<ContentType>("youtube");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function addContent() {
    const title = titleRef.current?.value?.trim();
    const link = linkRef.current?.value?.trim();
    const note = noteRef.current?.value?.trim();

    if (!title) {
      setError("Title is required");
      return;
    }

    const rawContent = type === "note" ? note : link;
    if (!rawContent) {
      setError(type === "note" ? "Note content is required" : "Link is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.post("/api/v1/items", {
        type,
        title,
        rawContent,
        link: type === "note" ? undefined : rawContent,
      });
      onSaved();
      onClose();
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const types: { value: ContentType; label: string }[] = [
    { value: "youtube", label: "YouTube" },
    { value: "twitter", label: "Twitter" },
    { value: "link", label: "Link" },
    { value: "note", label: "Note" },
  ];

  return (
    <div>
      {open && (
        <div>
          <div className="w-screen h-screen bg-gray-500 fixed top-0 left-0 opacity-60 flex justify-center"></div>
          <div className="w-screen h-screen fixed left-0 flex justify-center">
            <div className="flex flex-col justify-center">
              <span className="bg-white opacity-100 p-6 rounded w-[28rem]">
                <div className="flex justify-end">
                  <div onClick={onClose} className="cursor-pointer">
                    <CrossIcon />
                  </div>
                </div>

                <h2 className="text-lg font-medium mb-4">Add to your brain</h2>

                <Input reference={titleRef} placeholder="Title" />

                {type === "note" ? (
                  <textarea
                    ref={noteRef}
                    placeholder="Write your note..."
                    className="w-full border rounded px-3 py-2 mt-2 min-h-28 resize-none"
                  />
                ) : (
                  <Input reference={linkRef} placeholder="Paste link" />
                )}

                <div className="mt-3">
                  <p className="text-sm text-gray-600 mb-2">Type</p>
                  <div className="flex flex-wrap gap-2">
                    {types.map(({ value, label }) => (
                      <Button
                        key={value}
                        text={label}
                        variant={type === value ? "primary" : "secondary"}
                        onClick={() => setType(value)}
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

                <div className="flex justify-center mt-4">
                  <Button
                    onClick={addContent}
                    variant="primary"
                    text="Save"
                    loading={loading}
                  />
                </div>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatContentModal;
