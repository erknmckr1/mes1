// leaveConfig.js
import IzinForm from "./parts/İzinForm";
import LeaveTable from "./parts/LeaveTable";

export const leaveConfig = {
  "İzin Talebi Oluştur": {
    tabs: {
      1: { title: "Yeni İzin Talebi", component: <IzinForm /> },
      2: {
        title: "Bekleyen İzin Talepleri",
        component: <LeaveTable status="pending" />,
      },
      3: {
        title: "Onaylanan İzinler",
        component: <LeaveTable status="approved" />,
      },
      4: { title: "Geçmiş İzinlerim", component: <LeaveTable status="past" /> },
    },
    buttons: [
      { id: "1", label: "Yeni İzin" },
      { id: "2", label: "Bekleyen" },
      { id: "3", label: "Onaylanan" },
      { id: "4", label: "Geçmiş İzinlerim" },
    ],
  },
  "İzin Talebi Onayla": {
    tabs: {
      1: {
        title: "Bekleyen Onaylar",
        component: <LeaveTable status="pendingApproval" />,
      },
      2: { title: "Onaylananlar", component: <LeaveTable status="managerApproved" /> },
    },
    buttons: [
      { id: "1", label: "Bekleyen Onaylar" },
      { id: "2", label: "Onaylananlar" },
    ],
  },
  "Tüm İzin Talepleri": {
    tabs: {
      1: { title: "", component: <LeaveTable status="alltimeoff" /> },
    },
    buttons: [
      { id: "1", label: "Bütün İzin Talepleri" },
    ],
  },
  // Diğer flowları gerektiği gibi ekleyin
};
