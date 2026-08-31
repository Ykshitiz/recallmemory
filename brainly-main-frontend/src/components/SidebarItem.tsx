import type { ReactElement } from "react";

interface SidebarItemProps {
  text: string;
  icon?: ReactElement;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ text, icon, active, onClick }: SidebarItemProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-150 ${
        active ? "bg-violet-100 text-violet-800 font-semibold shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon && <div className="pr-2">{icon}</div>}
      <span>{text}</span>
    </button>
  );
};

export default SidebarItem;
