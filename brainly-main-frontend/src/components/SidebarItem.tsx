import type { ReactElement } from "react";

interface SidebarItemProps {
  text: string;
  icon?: ReactElement;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ text, icon, active, onClick }: SidebarItemProps) => {
  return (
    <div
      onClick={onClick}
      className={`flex text-gray-700 py-2 cursor-pointer rounded max-w-48 pl-4 transition-all duration-150 ${
        active ? "bg-purple-100 text-purple-700 font-medium" : "hover:bg-gray-200"
      }`}
    >
      {icon && <div className="pr-2">{icon}</div>}
      <div>{text}</div>
    </div>
  );
};

export default SidebarItem;
