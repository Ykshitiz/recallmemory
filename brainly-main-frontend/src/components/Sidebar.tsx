import Logo from "../icons/Logo";
import TwitterIcon from "../icons/TwitterIcon";
import YoutubeIcon from "../icons/YoutubeIcon";
import SidebarItem from "./SidebarItem";
import type { ItemType } from "../types/item";

type Filter = ItemType | "all";

interface SideBarProps {
  activeFilter: Filter;
  onFilterChange: (filter: Filter) => void;
}

const filters: { value: Filter; label: string; icon?: React.ReactNode }[] = [
  { value: "all", label: "All" },
  { value: "youtube", label: "YouTube", icon: <YoutubeIcon /> },
  { value: "twitter", label: "Twitter", icon: <TwitterIcon /> },
  { value: "link", label: "Links" },
  { value: "note", label: "Notes" },
];

const SideBar = ({ activeFilter, onFilterChange }: SideBarProps) => {
  return (
    <div className="h-screen bg-white border-r w-72 absolute left-0 top-0 pl-4">
      <div className="pt-4 pl-6">
        <div className="flex text-2xl pt-8 items-center">
          <div className="pr-2 text-purple-600">
            <Logo />
          </div>
          MindVault
        </div>
        <div className="pt-8 pl-4">
          {filters.map(({ value, label, icon }) => (
            <SidebarItem
              key={value}
              text={label}
              icon={icon}
              active={activeFilter === value}
              onClick={() => onFilterChange(value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SideBar;
