import React, { useEffect, useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-toastify";
import moment from "moment-timezone";
import {
  setSeletedLeaveRow,
  setSelectedRecords,
} from "../../../redux/workFlowManagement";
import { GiConfirmed, GiCancel } from "react-icons/gi";
import LeaveRangePicker from "./LeaveRangePicker";
import io from "socket.io-client"; // 🔹 Socket.io istemcisi ekleniyor

const socket = io("http://localhost:3003", {
  withCredentials: true,
  transports: ["websocket"],
});

function LeaveTable({ status }) {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const { selectedLeaveRow, records, filteredText } = useSelector(
    (state) => state.flowmanagement
  );
  const [selectionModel, setSelectionModel] = useState([]);
  const { allUser, permissions } = useSelector((state) => state.user);

  //! 📌 Endpointe göre veri çekecek fonksiyon...
  const fetchRecords = async () => {
    const { id_dec, roleId } = userInfo;
    try {
      const endpointMap = {
        pending: "/api/leave/getPendingLeaves",
        approved: "/api/leave/getApprovedLeaves",
        past: "/api/leave/getPastLeaves",
        pendingApproval: "/api/leave/getPendingApprovalLeaves",
        managerApproved: "/api/leave/getManagerApprovedLeaves",
        alltimeoff: "/api/leave/alltimeoff",
        leavesapprovedbytheinfirmary: "/api/leave/leavesApprovedByTheInfirmary",
        yaklasanizin: "/api/leave/personelToBeChecked",
      };
      const endpoint = endpointMap[status];

      //todo *** ** ** * *
      let response;
      if (endpoint === "/api/leave/alltimeof") {
        response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`
        );
      } else if (endpoint === "/api/leave/leavesApprovedByTheInfirmary") {
        response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
          { params: { id_dec, roleId } }
        );
      } else if (endpoint === "/api/leave/personelToBeChecked") {
        response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`
        );
      } else {
        response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
          { params: { id_dec } }
        );
      }

      if (response.status === 200) {
        dispatch(setSelectedRecords(response.data));
      } else {
        dispatch(setSelectedRecords([]));
      }
    } catch (err) {
      console.log(err);
      toast.error(err ? err.response.data : "");
      dispatch(setSelectedRecords([]));
    }
  };

  //! 📌 Sayfa yüklendiğinde ve socket olayını dinleyerek tabloyu güncelle
  useEffect(() => {
    fetchRecords();
    // 🔹 Socket.io ile backend'deki `updateLeaveTable` olayını dinle
    socket.on("updateLeaveTable", () => {
      console.log("İzin tablosu güncellendi.");
      fetchRecords();
    });

    return () => {
      socket.off("updateLeaveTable"); // Temizleme işlemi
    };
  }, [userInfo,status]);

  useEffect(() => {
    console.log("useEffect (status) çalıştı! Status:", status);
    fetchRecords();
  }, [status]);
  
  useEffect(() => {
    console.log("useEffect (userInfo, status) çalıştı!");
    fetchRecords();
  }, [userInfo, status]);
  
  useEffect(() => {
    console.log("Redux State Güncellendi:", records);
  }, [records]);
  
  

  const rows = records.map((item) => {
    const onayci1User = allUser.find((user) => user.id_dec === item.auth1);
    const onayci2User = allUser.find((user) => user.id_dec === item.auth2);
    function leaveStatus() {
      if (item.leave_status === "1") {
        return "1. Onaycı bekleniyor";
      } else if (item.leave_status === "2") {
        return "2. Onaycı bekleniyor";
      } else if (item.leave_status === "3") {
        return "İzin Onaylandı";
      } else {
        return "İzin iptal edildi.";
      }
    }
    return {
      id: item.leave_uniq_id,
      name: item.op_username,
      leave_start_date: moment(item.leave_start_date)
        .tz("Europe/Istanbul")
        .format("DD/MM/YYYY hh:mm A"),
      leave_end_date: moment(item.leave_end_date)
        .tz("Europe/Istanbul")
        .format("DD/MM/YYYY hh:mm A"),
      leave_reason: item.leave_reason,
      leave_status: leaveStatus(),
      auth1: item.auth1,
      auth2: item.auth2,
      onayci1: onayci1User ? onayci1User.op_username : "",
      onayci2: onayci2User ? onayci2User.op_username : "",
      leave_uniq_id: item.leave_uniq_id,
    };
  });

  const columns = [
    {
      field: "operation",
      headerName: "Operasyon",
      width: 120,
      renderCell: (params) => {
        const row = params.row;

        const hasFirstApprovalPermission = permissions.includes("1. Onay");
        const hasSecondApprovalPermission = permissions.includes("2. Onay");
        const hasCancelPermission = permissions.includes("İptal");
        return (
          <>
            {(status === "pendingApproval" ||
              (status === "alltimeoff" &&
                (row.leave_status === "1. Onaycı bekleniyor" ||
                  row.leave_status === "2. Onaycı bekleniyor"))) &&
              (hasFirstApprovalPermission || hasSecondApprovalPermission) && (
                <button onClick={() => approveLeave(row)}>
                  <GiConfirmed className="text-green-600 hover:text-green-400 text-[45px]" />
                </button>
              )}
            {(((status === "alltimeoff" ||
              status === "leavesapprovedbytheinfirmary") &&
              (row.leave_status === "İzin Onaylandı" ||
                row.leave_status === "1. Onaycı bekleniyor" ||
                row.leave_status === "2. Onaycı bekleniyor")) ||
              status === "pendingApproval" ||
              status === "pending") &&
              hasCancelPermission && (
                <button onClick={() => cancelPendingApprovalLeave(row)}>
                  <GiCancel className="text-center text-red-600 hover:text-red-400 text-[45px]" />
                </button>
              )}
          </>
        );
      },
    },
    { field: "name", headerName: "Kullanici İsmi", width: 150 },
    {
      field: "leave_start_date",
      headerName: "İzin Başlangıc Tarihi",
      width: 180,
    },
    { field: "leave_end_date", headerName: "İşe Dönüş Tarihi", width: 180 },
    { field: "leave_reason", headerName: "İzin Nedeni", width: 200 },
    { field: "leave_status", headerName: "İzin Durumu", width: 150 },
    { field: "onayci1", headerName: "1. Onaylayici", width: 150 },
    { field: "onayci2", headerName: "2. Onaylayici", width: 150 },
  ];

  // Tıklanan satırın bıglılerını tutacak fonksıyon...
  function handleSelectedRow(params) {
    const { id, leave_status } = params.row;
    if (leave_status !== "3" && leave_status !== "4") {
      setSelectionModel((prevSelectionModel) => {
        if (prevSelectionModel.includes(id)) {
          return prevSelectionModel.filter((item) => item !== id);
        } else {
          return [...prevSelectionModel, id];
        }
      });
    }
  }

  //! İzni İptal Edecek fonksıyon...
  async function cancelPendingApprovalLeave(row) {
    if (
      confirm(
        `${
          userInfo?.roleId === 7
            ? "İzin iptal edilsin mi ? "
            : "Onay bekleyen izin talebi iptal edilsin mi ? "
        }`
      )
    ) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/cancelPendingApprovalLeave`,
          {
            params: {
              leave_uniq_id: row.leave_uniq_id,
              id_dec: userInfo.id_dec,
            },
          }
        );
        if (response.status === 200) {
          toast.success("İzin Talebi İptal Edildi.");
          fetchRecords();
          setSelectionModel([]);
        } else if (response.status === 404) {
          toast.error("İlgili izine dair bilgi bulunamadı.");
        }
      } catch (err) {
        console.log(err);
        setSelectionModel([]);
      }
    }
  }

  //! İzin onaylayacak fonksıyon
  async function approveLeave(row) {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave`,
        {
          params: {
            leave_uniq_id: row.leave_uniq_id,
            id_dec: userInfo.id_dec,
          },
        }
      );
      if (response.status === 200) {
        toast.success("İzin Talebi Onaylandı.");
        fetchRecords();
        dispatch(setSeletedLeaveRow(null));
        setSelectionModel([]);
      } else {
        toast.error("İzin talebi onaylanamadı.");
        setSelectionModel([]);
      }
    } catch (err) {
      console.log(err);
      toast.error(
        "Seçitiğiniz izin talebi onaylanmıs ya da böyle bir izin yok."
      );
      setSelectionModel([]);
    }
  }

  // status e gore satır renklendir...
  const getRowClassName = (params) => {
    const { row } = params;
    if (
      (status === "past" || status === "alltimeoff") &&
      row.leave_status === "İzin Onaylandı"
    ) {
      return "green-row";
    } else if (
      (status === "past" || status === "alltimeoff") &&
      row.leave_status === "İzin iptal edildi."
    ) {
      return "red-row";
    } else if (status === "yaklasanizin") {
      return "blinking-row";
    } else if (
      selectionModel.includes(row.id) &&
      row.leave_status !== "4" &&
      row.leave_status !== "3"
    ) {
      return "selected-row";
    }
    return "";
  };

  //! Seçili izin taleplerini toplu onay isteği atacak fonksıyon
  async function handleConfirmSelections() {
    if (confirm("Seçili izin talepleri onaylansın mı ?")) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/confirmSelections`,
          {
            params: {
              leaveIds: selectionModel.join(","),
              id_dec: userInfo.id_dec,
            },
          }
        );
        if (response.status === 200) {
          toast.success("Seçili İzin Talepleri Onaylandı.");
          await fetchRecords();
          setSelectionModel([]);
        } else {
          toast.error("Seçili İzin Talepleri Onaylanmadı.");
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
  //! Toplu iptal isteği
  async function handleCancelSelectionsLeave() {
    if (confirm("Seçili talepler iptal edilsin mi? ")) {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/cancelSelectionsLeave`,
          {
            params: {
              leaveIds: selectionModel.join(","),
              id_dec: userInfo.id_dec,
            },
          }
        );
        if (response.status === 200) {
          toast.success("İzin talepleri başarıyla iptal edildi...");
          fetchRecords();
          setSelectionModel([]);
        } else {
          toast.error("İzin talepleri iptal edilemedi...");
        }
      } catch (err) {
        console.error("Error in handleCancelSelectionsLeave function:", err);
        toast.error("İzin talepleri iptal edilemedi... ");
      }
    }
  }

  // seçili satırları temızleyecek fonksıyon...
  function clearSelections() {
    setSelectionModel([]);
  }

  // Tüm satırları seç
  function handleSelectedAllRow() {
    const allSelection = rows.map((item) => item.id);
    setSelectionModel(allSelection);
  }
  return (
    <div className="h-[550px] sm:max-w-full relative  ">
      {status !== "pending" &&
        status !== "approved" &&
        status !== "past" &&
        status !== "managerApproved" &&
        status !== "personnelcreateleave" &&
        status !== "yaklasanizin" && (
          <div className="flex justify-between items-center px-6 bg-[#C9DABF]">
            {status === "alltimeoff" && <LeaveRangePicker />}
            {/* onay butonları */}
            {status !== "alltimeoff" && (
              <div className="flex gap-x-3 sm:ms-2 py-1 sm:py-0">
                <button
                  className="sm:mb-2 sm:p-2 text-xs h-12 bg-green-500 text-white rounded"
                  disabled={selectionModel.length < 2}
                  onClick={handleConfirmSelections}
                >
                  Seçilenleri Onayla
                </button>
                <button
                  className="sm:mb-2 sm:p-2 py-1 text-xs h-12 bg-red-500 text-white rounded"
                  disabled={selectionModel.length < 2}
                  onClick={handleCancelSelectionsLeave}
                >
                  Seçilenleri İptal Et
                </button>
                <button
                  className="sm:mb-2 sm:p-2 text-xs h-12 bg-red-500 text-white rounded"
                  onClick={handleSelectedAllRow}
                >
                  Tümünü Seç
                </button>
                <button
                  className="sm:mb-2 sm:p-2 text-xs h-12 bg-gray-500 text-white rounded"
                  onClick={clearSelections}
                >
                  Seçili Talepleri Kaldır
                </button>
              </div>
            )}
          </div>
        )}

      <DataGrid
        rows={rows}
        columns={columns}
        pagination={true}
        onRowClick={handleSelectedRow}
        getRowClassName={getRowClassName}
        disableRowSelectionOnClick // Seçimi devre dışı bırakır
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          filter: {
            filterModel: {
              items: [],
              quickFilterValues: [],
            },
          },
        }}
        slots={{ toolbar: GridToolbar }}
        slotProps={{
          toolbar: {
            showQuickFilter: true,
          },
        }}
        pageSizeOptions={[10, 30, 50, 100]}
      />
    </div>
  );
}

export default LeaveTable;
