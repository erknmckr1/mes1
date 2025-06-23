"use client";
import React from "react";
import Bar from "../charts/BarChart";
import Pie from "../charts/Pie";
import FilterPanel from "../uı/FilterPanel";
import ChartCard from "../charts/ChartCard";
import InsightPanel from "../uı/InsightPanel";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import ChatBox from "../chatbox/ChatBox";
import { useEffect } from "react";
import { setAnalyticsData, setActiveView } from "@/redux/dashboardSlice";
import DashboardCardGroup from "../uı/DashboardCardGroup";
function DashboardSection() {
  const { filters, analyticsData, activeView } = useSelector(
    (state) => state.dashboard
  );
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchAllAnalytics = async () => {
      try {
        const [
          workStatusRes,
          machineStatusRes,
          activeWorks,
          repairReasonCount,
          stoppedWorks
        ] = await Promise.all([
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getWorkStatusData`,
            {
              params: filters,
            }
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getMachineStatusOverview`
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getOpenDurationOfActiveWorks`
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getRepairReasonStats`,
            {
              params: {
                work_start_date: filters.startDate,
                work_end_date: filters.endDate,
              },
            }
          ),
          axios.get(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/getStoppedWorksDuration`
          ),
        ]);

        dispatch(
          setAnalyticsData({
            key: "workStatusData",
            data: workStatusRes.data || [],
          })
        );
        dispatch(
          setAnalyticsData({
            key: "machineStatusData",
            data: machineStatusRes.data,
          })
        );
        dispatch(
          setAnalyticsData({
            key: "activeMachineDuration",
            data: activeWorks.data,
          })
        );
        dispatch(
          setAnalyticsData({
            key: "repairReasonStats",
            data: repairReasonCount.data,
          })
        );
        dispatch(
          setAnalyticsData({
            key: "stoppedWorkDuration",
            data: stoppedWorks.data,
          })
        );
      } catch (err) {
        console.error("Analytics verileri çekilemedi", err);
      }
    };

    fetchAllAnalytics();
  }, []); // filtre değiştiğinde tekrar çek

  //* activeMachineDuration
  const chartData = analyticsData.activeMachineDuration?.data?.map((item) => ({
    label: item.machine_name
      ? `${item.machine_name} (${item.order_no})`
      : item.process_name
      ? `${item.process_name} (${item.order_no})`
      : `Bilinmeyen (${item.order_no})`,
    value: item.acik_sure_dakika,
  }));

  const labels = chartData && chartData.map((item) => item.label);
  const values = chartData && chartData.map((item) => item.value);
  //* activeMachineDuration

  //* repairCount variable start
  const repairCountLabel =
    analyticsData.repairReasonStats &&
    analyticsData.repairReasonStats?.data?.map((item) => item.reason);
  const repairCountValue =
    analyticsData.repairReasonStats &&
    analyticsData.repairReasonStats?.data?.map((item) => item.count);
  //* repairCount variable end

  //* duran iş süresi variable start
  const stopDurationLabels =
    analyticsData.stoppedWorkDuration &&
    analyticsData.stoppedWorkDuration.data.map((item) => item.order_id);
  const stopDurationValue =
    analyticsData.stoppedWorkDuration &&
    analyticsData.stoppedWorkDuration.data.map(
      (item) => item.durus_suresi_dakika
    );
  //* duran iş süresi variable end

  return (
    <div className="w-full h-full">
      <ChatBox />
      <div className="w-full h-full flex justify-between items-center">
        <div className="flex w-2/3 h-full flex-col gap-y-2 overflow-y-auto">
          <div className="w-full h-auto">
            {analyticsData.activeMachineDuration && (
              <ChartCard
                title={
                  activeView === "active"
                    ? "Siparişlerin Açık kalma Süreleri"
                    : "Durdurulmuş İşlerin Süresi"
                }
                headerRight={
                  <div className="space-x-2">
                    <button
                      onClick={() => dispatch(setActiveView("active"))}
                      className={`text-sm px-2 py-1 rounded ${
                        activeView === "active"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700"
                      }`}
                    >
                      Açık
                    </button>
                    <button
                      onClick={() => dispatch(setActiveView("stopped"))}
                      className={`text-sm px-2 py-1 rounded ${
                        activeView === "stopped"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-700"
                      }`}
                    >
                      Durdurulmuş
                    </button>
                  </div>
                }
              >
                {activeView === "active" ? (
                  <Bar items={{ labels, values }} />
                ) : (
                  <Bar
                    items={{
                      labels: stopDurationLabels,
                      values: stopDurationValue,
                    }}
                  />
                )}
              </ChartCard>
            )}
          </div>
          <div className="w-full h-auto grid grid-cols-2 gap-4">
            <ChartCard title="İş Durumu Dağılımı">
              <Pie data={analyticsData?.workStatusData} />
            </ChartCard>
            <ChartCard title="Makine Durumu">
              <DashboardCardGroup
                items={[
                  {
                    label: "Toplam",
                    value: analyticsData?.machineStatusData?.data?.total,
                  },
                  {
                    label: "Aktif",
                    value: analyticsData?.machineStatusData?.data?.active,
                  },
                  {
                    label: "Durdurulmuş",
                    value: analyticsData?.machineStatusData?.data?.stopped,
                  },
                  {
                    label: "Pasif",
                    value: analyticsData?.machineStatusData?.data?.passive,
                  },
                ]}
              />
            </ChartCard>
          </div>
          {analyticsData.activeMachineDuration && (
            <ChartCard title="Tamir Nedeni Dağılımı">
              <Bar
                items={{ labels: repairCountLabel, values: repairCountValue }}
              />
            </ChartCard>
          )}
        </div>
        {/* chart area */}

        <div className="w-1/3 h-full">
          <FilterPanel />
          <InsightPanel />
        </div>
      </div>
    </div>
  );
}

export default DashboardSection;
