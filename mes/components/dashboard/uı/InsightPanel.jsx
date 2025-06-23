import React from "react";
import { useSelector } from "react-redux";
function InsightPanel() {
  const { dashboardData } = useSelector((state) => state.dashboard);
  // Status sayılarını çek
  const getCountByStatus = (status) => {
    return (
      dashboardData?.statusCount?.find((item) => item.work_status === status)
        ?.count || 0
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3 text-sm p-6 text-white">
      <div className="bg-[#111827] p-3 rounded-lg border border-gray-700">
        🏭 <strong>Aktif İş:</strong> {getCountByStatus("1")}
      </div>
      <div className="bg-[#111827] p-3 rounded-lg border border-gray-700">
        👨‍🔧 <strong>Aktif Personel:</strong>{" "}
        {dashboardData?.activeOperatorCount || 0}
      </div>
      <div className="bg-[#111827] p-3 rounded-lg border border-gray-700">
        ✅ <strong>Biten İş:</strong> {getCountByStatus("4")}
      </div>
      <div className="bg-[#111827] p-3 rounded-lg border border-gray-700">
        🛠️ <strong>Duran İş:</strong> {getCountByStatus("3")}
      </div>
    </div>
  );
}

export default InsightPanel;
