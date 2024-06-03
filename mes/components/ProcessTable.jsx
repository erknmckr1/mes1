"use client";
import React, { useState } from "react";

const processTypes = ["Cutting", "Welding", "Assembling", "Painting"];
const filteredMachine = [
  { machine_name: "Machine A" },
  { machine_name: "Machine B" },
  { machine_name: "Machine C" },
  { machine_name: "Machine D" },
];

function ProcessArea() {
  const [onProcess, setOnProcess] = useState(null);
  const [onMachine, setOnMachine] = useState(null);

  return (
    <div className="w-full h-full overflow-y-hidden bg-white text-black border-l-2">
      <div className="w-full h-full flex">
        <div className="w-1/2 h-full flex flex-col">
          <div className="px-6 py-3 text-left text-xs bg-secondary  font-medium uppercase tracking-wider">
            Prosesler
          </div>
          <ul className="overflow-y-auto text-center bg-white border-t-2">
            {processTypes.map((item, index) => (
              <li
                onClick={() => setOnProcess(item)}
                key={index}
                className={`p-2 hover:bg-green-600 border cursor-pointer ${
                  onProcess === item
                    ? "bg-green-600 text-white font-semibold transition-all"
                    : ""
                }`}
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="w-1/2 h-full flex flex-col bg-white">
          <div className="px-6 py-3 text-left text-xs bg-secondary  font-medium uppercase tracking-wider">
            Makineler
          </div>
          <ul className="overflow-y-auto bg-white text-center border-t-2">
            {filteredMachine.map((item, index) => (
              <li
                key={index}
                className={`p-2 hover:bg-green-600 border cursor-pointer ${
                  onMachine === item.machine_name ? "bg-green-500" : ""
                }`}
                onClick={() => setOnMachine(item.machine_name)}
              >
                {item.machine_name}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProcessArea;
