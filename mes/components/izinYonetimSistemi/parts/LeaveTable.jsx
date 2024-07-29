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

function LeaveTable({ status }) {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const { selectedLeaveRow, records, filteredText } = useSelector(
    (state) => state.flowmanagement
  );

  //! Endpointe göre veri çekecek fonksiyon...
  const fetchRecords = async () => {
    const { id_dec } = userInfo;
    try {
      const endpointMap = {
        pending: "/api/leave/getPendingLeaves",
        approved: "/api/leave/getApprovedLeaves",
        past: "/api/leave/getPastLeaves",
        pendingApproval: "/api/leave/getPendingApprovalLeaves",
        managerApproved: "/api/leave/getManagerApprovedLeaves",
        alltimeoff: "/api/leave/alltimeoff",
      };
      const endpoint = endpointMap[status];

      //todo *** ** ** * *
      let response;
      if (endpoint === "/api/leave/alltimeof") {
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
      dispatch(setSelectedRecords([]));
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userInfo, status]);

  // const filterRecords = (records, filterText) => {
  //   if (!filterText) return records;
  //   const lowercasedFilter = filterText.toLowerCase();
  //   return records.filter((record) => {
  //     return Object.values(record).some((value) =>
  //       String(value).toLowerCase().includes(lowercasedFilter)
  //     );
  //   });
  // };

  // const filteredRecords = filterRecords(records, filteredText);

  const rows = records.map((item, index) => ({
    id: item.leave_uniq_id,
    name: item.op_username,
    leave_start_date: moment(item.leave_start_date)
      .tz("Europe/Istanbul")
      .format("DD/MM/YYYY hh:mm A"),
    leave_end_date: moment(item.leave_end_date)
      .tz("Europe/Istanbul")
      .format("DD/MM/YYYY hh:mm A"),
    leave_reason: item.leave_reason,
    leave_status: item.leave_status,
    auth1: item.auth1,
    auth2: item.auth2,
    leave_uniq_id: item.leave_uniq_id,
  }));

  const columns = [
    { field: "name", headerName: "Kullanici İsmi", width: 150 },
    {
      field: "leave_start_date",
      headerName: "İzin Başlangıc Tarihi",
      width: 180,
    },
    { field: "leave_end_date", headerName: "İşe Dönüş Tarihi", width: 180 },
    { field: "leave_reason", headerName: "İzin Nedeni", width: 200 },
    { field: "leave_status", headerName: "İzin Durumu", width: 150 },
    { field: "auth1", headerName: "1. Onaylayici", width: 150 },
    { field: "auth2", headerName: "2. Onaylayici", width: 150 },
    {
      field: "operation",
      headerName: "Operasyon",
      width: 100,
      renderCell: (params) => {
        const row = params.row;
        return (
          <>
            {status === "pendingApproval" && (
              <button onClick={() => approveLeave(row)}>
                <GiConfirmed className="text-green-600 hover:text-green-400 text-[25px]" />
              </button>
            )}
            {status !== "past" &&
              status !== "approved" &&
              status !== "managerApproved" &&
              status !== "alltimeoff" && (
                <button onClick={() => cancelPendingApprovalLeave(row)}>
                  <GiCancel className=" text-center text-red-600 hover:text-red-400 text-[25px]" />
                </button>
              )}
          </>
        );
      },
    },
  ];

  // Satır sececek fonksıyon
  function handleSelectedRow(params) {
    const { id } = params.row;
    if (selectedLeaveRow && selectedLeaveRow === id) {
      dispatch(setSeletedLeaveRow(null));
    } else {
      dispatch(setSeletedLeaveRow(id));
    }
  }

  //! İptal edilmiş izinleri cekcek fonksıyon...
  async function cancelPendingApprovalLeave(row) {
    if (confirm("Onay bekleyen izin talebi iptal edilsin mi ? ")) {
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
        } else if (response.status === 404) {
          toast.error("İlgili izine dair bilgi bulunamadı.");
        }
      } catch (err) {
        console.log(err);
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
      } else {
        toast.error("İzin talebi onaylanamadı.");
      }
    } catch (err) {
      console.log(err);
    }
  }

  const getRowClassName = (params) => {
    const { row } = params;
    if (status === "past" && row.leave_status === "3") {
      return "green-row";
    } else if (status === "past" && row.leave_status === "4") {
      return "red-row";
    }
    return "";
  };

  return (
    <div className="h-[550px] max-w-full relative  ">
      <DataGrid
        rows={rows}
        columns={columns}
        pagination={false}
        onRowClick={handleSelectedRow}
        getRowClassName={getRowClassName}
        rowClassName={getRowClassName}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 8 },
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
        pageSizeOptions={[8, 8]}
      />
    </div>
  );
}

export default LeaveTable;
