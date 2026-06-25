import Logo from "../icons/Logo";
import TwitterIcon from "../icons/TwitterIcon";
import YoutubeIcon from "../icons/YoutubeIcon";
import SidebarItem from "./SidebarItem";

const SideBar = () => {
  return (
    <div className="h-screen bg-white border-r w-76 absolute left-0 top-0 pl-4">
      <div className="pt-4 pl-6">
        <div className="flex text-2xl pt-8 items-center">
          <div className="pr-2 text-purple-600">
            <Logo />
          </div>
          Brainly
        </div>
        <div className="pt-8 pl-4">

        <SidebarItem text="Twitter" icon={<TwitterIcon />}></SidebarItem>
        <SidebarItem text="YouTube" icon={<YoutubeIcon />}></SidebarItem>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
