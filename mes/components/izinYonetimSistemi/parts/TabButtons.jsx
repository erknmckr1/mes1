import React from 'react';
import Button from '@/components/ui/Button';
import { leaveConfig } from '../LeaveConfig';

function TabButtons({ tab, setTab, selectedFlow }) {
  const currentFlow = leaveConfig[selectedFlow];
  const buttons = currentFlow?.buttons || [];

  return (
    <div className="bg-[#C9DABF] rounded-sm h-[100]">
      <h1 className="text-2xl rounded-md text-center uppercase text-black font-bold py-2 ps-4 w-full">
        {currentFlow?.tabs[tab]?.title}
      </h1>
      <div className="border-b flex justify-center gap-x-3 py-1 sm:ps-4">
        {buttons.map(button => (
          <Button
            key={button.id}
            onClick={() => setTab(button.id)}
            className={`sm:px-4 sm:py-2 text-sm sm:text-md ${
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
