import React, { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import CenterNotification from './notification/CenterNotification';

const BottomBar = ({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) => {
  const [notificationOpen, setNotificationOpen] = useState(false);
  return (
    <div className="flex items-center justify-end p-4 bg-white border-t border-gray-200 shadow-sm gap-2">
      <button
        onClick={() => setNotificationOpen(true)}
        className="transition px-4 py-2 rounded-md focus:outline-none focus:ring-0 focus:ring-offset-0 focus:shadow-none"
        aria-label="Apri notifiche"
        title="Centro notifiche"
        style={{ alignSelf: 'flex-start', marginTop: '-10px', marginRight: '-8px' }}
      >
        <PanelLeft className="w-5 h-5 text-gray-500 hover:text-gray-700 transition" />
      </button>
      <CenterNotification open={notificationOpen} setOpen={setNotificationOpen} />
    </div>
  );
};

export default BottomBar;