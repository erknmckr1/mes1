import React from 'react';
import Button from '@/components/ui/Button';
import { leaveConfig } from '../LeaveConfig';

function TabButtons({ tab, setTab, selectedFlow }) {
  const currentFlow = leaveConfig[selectedFlow];
  const buttons = currentFlow?.buttons || [];

  return (
    <div className="bg-slate-400 rounded-sm">
      <h1 className="text-2xl rounded-md text-center uppercase text-black font-bold py-2 ps-4 w-full">
        {currentFlow?.tabs[tab]?.title}
      </h1>
      <div className="border-b flex justify-center gap-x-3 py-1 ps-4">
        {buttons.map(button => (
          <Button
            key={button.id}
            onClick={() => setTab(button.id)}
            className={`px-4 py-2 ${
              tab === button.id
                ? "bg-secondary !text-black hover:bg-secondary"
                : ""
            }`}
          >
            {button.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export default TabButtons;
