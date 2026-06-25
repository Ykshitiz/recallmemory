import { useState } from "react";
import Button from "../components/Button";
import PlusIcon from "../icons/PlusIcon";
import ShareIcon from "../icons/ShareIcon";
import Card from "../components/Card";
import CreatContentModal from "../components/CreatContentModal";
import SideBar from "../components/Sidebar";

function Dashboard() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <SideBar />
      <div className="p-4 ml-72 min-h-screen  bg-gray-100 border-2 ">
        <CreatContentModal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false);
          }}
        ></CreatContentModal>
        <div className="flex justify-end gap-4 ">
          <Button
            onClick={() => {
              setModalOpen(true);
            }}
            variant="primary"
            text="Add Content"
            startIcon={<PlusIcon />}
          />
          <Button
            variant="secondary"
            text="Share Brain"
            startIcon={<ShareIcon />}
          />
        </div>
        <div className="flex gap-4">
          <Card
            type="twitter"
            title="first tweet"
            link="https://x.com/kunalb11/status/1944744899955310725"
          />
          <Card
            type="youtube"
            title="first youtube"
            link="https://www.youtube.com/embed/_oO4Qi5aVZs?si=mPZy8i6lpv9Hs1oh"
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
