import Logo from "../icons/Logo";
import TwitterIcon from "../icons/TwitterIcon";
import YoutubeIcon from "../icons/YoutubeIcon";
import SidebarItem from "./SidebarItem";
import type { ReactElement } from "react";
import type { ItemType } from "../types/item";

type Filter = ItemType | "all";
interface SideBarProps { activeFilter: Filter; onFilterChange: (filter: Filter) => void; }

const filters: { value: Filter; label: string; icon?: ReactElement }[] = [
  { value: "all", label: "All saves" },
  { value: "youtube", label: "YouTube", icon: <YoutubeIcon /> },
  { value: "twitter", label: "Twitter / X", icon: <TwitterIcon /> },
  { value: "link", label: "Links" },
  { value: "note", label: "Notes" },
];

const SideBar = ({ activeFilter, onFilterChange }: SideBarProps) => (
  <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-violet-100 bg-white px-5 py-7 lg:block">
    <div className="flex items-center gap-3 px-3 text-xl font-semibold tracking-tight text-slate-900">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 text-white"><Logo /></span>
      MindVault
    </div>
    <p className="mt-3 px-3 text-sm leading-6 text-slate-500">Save the things worth remembering. Find them when they matter.</p>
    <p className="mt-10 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Library</p>
    <nav className="mt-3 space-y-1">
      {filters.map(({ value, label, icon }) => (
        <SidebarItem key={value} text={label} icon={icon} active={activeFilter === value} onClick={() => onFilterChange(value)} />
      ))}
    </nav>
    <div className="absolute bottom-7 left-5 right-5 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">
      <p className="font-medium">Your private knowledge space</p>
      <p className="mt-1 text-xs leading-5 text-violet-700">AI summaries, semantic search, and grounded answers.</p>
    </div>
  </aside>
);

export default SideBar;
