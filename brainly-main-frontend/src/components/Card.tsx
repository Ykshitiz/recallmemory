import ShareIcon from "../icons/ShareIcon";
import type { ItemType } from "../types/item";

interface CardProps {
  title: string;
  link: string;
  itemType: ItemType;
  summary?: string;
  tags?: string[];
  aiProcessed?: boolean;
}

function toYoutubeEmbed(url: string) {
  const videoIdMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]+)/
  );
  if (videoIdMatch) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}`;
  }
  return url.replace("watch?v=", "embed/").replace("watch", "embed");
}

const Card = ({
  title,
  link,
  itemType,
  summary,
  tags = [],
  aiProcessed,
}: CardProps) => {
  return (
    <div className="p-4 bg-white rounded-md border-gray-200 max-w-72 border min-h-48 min-w-72">
      <div className="flex justify-between gap-2">
        <div className="flex items-center text-md min-w-0">
          <div className="text-gray-500 pr-2 shrink-0">
            <ShareIcon />
          </div>
          <span className="font-medium truncate">{title}</span>
        </div>

        {itemType !== "note" && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="text-purple-600 text-sm shrink-0"
          >
            Open
          </a>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-1 capitalize">{itemType}</p>

      {!aiProcessed && (
        <p className="text-xs text-amber-600 mt-2">AI processing pending...</p>
      )}

      {summary && (
        <p className="text-sm text-gray-600 mt-2 line-clamp-4 whitespace-pre-line">
          {summary}
        </p>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-4">
        {itemType === "youtube" && (
          <iframe
            className="w-full aspect-video"
            src={toYoutubeEmbed(link)}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}

        {itemType === "note" && (
          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
            {link}
          </p>
        )}

        {itemType === "twitter" && (
          <a
            href={link.replace("x.com", "twitter.com")}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-blue-600 underline"
          >
            View tweet
          </a>
        )}

        {itemType === "link" && (
          <p className="text-sm text-gray-500 break-all line-clamp-3">{link}</p>
        )}
      </div>
    </div>
  );
};

export default Card;
