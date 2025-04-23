"use client";

export default function CilaMain() {
  return (
    <div className="grid grid-cols-2 w-screen h-screen">
      {/* Sol panel */}
      <iframe
        src="/uretim/montaj/cila/panel?panel=1"
        className="w-full h-full border-r-2 border-white"
      />
      {/* Sağ panel */}
      <iframe
        src="/uretim/montaj/cila/panel?panel=2"
        className="w-full h-full"
      />
    </div>
  );
}
