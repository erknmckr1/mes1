import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { setSeletedLeaveRow } from "../../../redux/workFlowManagement";
import { GiConfirmed, GiCancel } from "react-icons/gi";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
function LeaveTable({ status }) {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.user);
  const [records, setRecords] = useState([]);
  const { selectedLeaveRow } = useSelector((state) => state.flowmanagement);
  const fetchRecords = async () => {
    const { id_dec } = userInfo;
    try {
      const endpointMap = {
        pending: "/api/leave/getPendingLeaves", // kullanıcının bekleyen ızınlerı ıcın gereklı route...
        approved: "/api/leave/getApprovedLeaves", // Kullaıcının onaylanan ızınlerı
        past: "/api/leave/getPastLeaves", // Kullanıcının gecmıs ızınlerı
        pendingApproval: "/api/leave/getPendingApprovalLeaves",
        managerApproved: "/api/leave/getManagerApprovedLeaves",
      };
      const endpoint = endpointMap[status];

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}${endpoint}`,
        { params: { id_dec } }
      );
      if (response.status === 200) {
        setRecords(response.data);
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.log(err);
      setRecords([]);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [userInfo, status]);

  const columns = [
    {
      headerName: "Kullanici İsmi",
      className:
        "text-center border-r py-5 text-left text-xs   uppercase tracking-wider",
    },
    {
      headerName: "İzin Başlangıc Tarihi",
      className:
        "text-center border-r  py-3 text-left text-xs  uppercase tracking-wider",
    },
    {
      headerName: "İşe Dönüş Tarihi",
      className:
        "text-center border-r  py-3 text-left text-xs  uppercase tracking-wider",
    },
    {
      headerName: "İzin Nedeni",
      className:
        "text-center border-r  py-3 text-left text-xs  uppercase tracking-wider",
    },
    {
      headerName: "İzin Durumu",
      className:
        "text-center border-r  py-3 text-left text-xs  uppercase tracking-wider",
    },
    {
      headerName: "1. Onaylayici",
      className:
        "text-center border-r  py-3 text-left text-xs  uppercase tracking-wider",
    },
    {
      headerName: "2. Onaylayici",
      className:
        "text-center border-r  py-3 text-left text-xs  uppercase tracking-wider",
    },
    {
      headerName: "Operasyon",
      className:
        "text-center border-r  py-3 text-left text-sm  uppercase tracking-wider",
    },
  ];

  const rows =
    records &&
    records.map((item, index) => ({
      name: item.op_username,
      id: item.id_dec,
      leave_start_date: item.leave_start_date,
      leave_end_date: item.leave_end_date,
      leave_reason: item.leave_reason,
      leave_status: item.leave_status,
      auth1:item.auth1,
      auth2:item.auth2,
      leave_uniq_id: item.leave_uniq_id,

    }));

  // satırı sececek fonksıyon...
  function handleSelectedRow(leave_uniq_id) {
    if (selectedLeaveRow && selectedLeaveRow === leave_uniq_id) {
      dispatch(setSeletedLeaveRow(null));
    } else {
      dispatch(setSeletedLeaveRow(leave_uniq_id));
    }
  }

  //! Kullanıcının onay bekleyen siparişini iptal edecek istek...
  async function cancelPendingApprovalLeave(row) {
    if (confirm("Onay bekleyen izin talebi iptal edilsin mi ? ")) {
      try {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/cancelPendingApprovalLeave`,
          {
            leave_uniq_id: row.leave_uniq_id,
            id_dec: userInfo.id_dec,
          }
        );
        if (response.status === 200) {
          toast.success("İzin Talebi İptal Edildi.");
          fetchRecords(); // İlgili sekmenin verilerini tekrar yüklüyoruz.
        } else if (response.status === 404) {
          toast.error("İlgili izine dair bilgi bulunamadı.");
        }
      } catch (err) {
        console.log(err);
      }
    }
  }

  //! seçili talebi onaylayacak fonskyın
  async function approveLeave(row) {
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/approveLeave`,
        {
          leave_uniq_id: row.leave_uniq_id,
          id_dec: userInfo.id_dec,
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

  console.log(records);
  return (
    <div className="h-[450px] max-w-full relative overflow-scroll ">
      <table className=" w-full bg-[#5F6F65]  shadow-xl ">
        <thead className="bg-secondary text-black sticky top-0">
          <tr className="px-2">
            {columns.map((column, index) => (
              <th key={index} className={`${column.className} px-5`}>
                {column.headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows &&
            rows.map((row, index) => {
              const date = new Date(row.leave_start_date);
              const formattedDate = date.toLocaleDateString();
              const formattedTime = date.toLocaleTimeString();

              const dateEnd = new Date(row.leave_end_date);
              const formattedEndDate = dateEnd.toLocaleDateString();
              const formattedEndTime = dateEnd.toLocaleTimeString();
              return (
                <tr
                  onClick={() => handleSelectedRow(row.leave_uniq_id)}
                  key={index}
                  className={`h-[50px] cursor-pointer border-b ${
                    selectedLeaveRow === row.leave_uniq_id ? "bg-pink-700" : ""
                  }`}
                >
                  <td className=" border-r text-center px-5   py-3 whitespace-nowrap">
                    {row.name}
                  </td>
                  <td className="text-center border-r px-5 py-3 whitespace-nowrap">
                    {formattedDate} - {formattedTime}
                  </td>
                  <td className="text-center border-r px-5  py-3 whitespace-nowrap">
                    {formattedEndDate} - {formattedEndTime}
                  </td>
                  <td className="text-center border-r px-5  py-3 whitespace-nowrap">
                    {row.leave_reason}
                  </td>
                  <td className="text-center border-r px-5 py-3 whitespace-nowrap">
                    {row.leave_status}
                  </td>
                  <td className="text-center border-r px-5  py-3 whitespace-nowrap">
                    {row.auth1}
                  </td>
                  <td className="text-center border-r px-5 py-3 whitespace-nowrap">
                    {row.auth2}
                  </td>
                  {status !== "past" && (
                    <td className="text-[25px] flex justify-evenly items-center border-r py-3 whitespace-nowrap">
                      {status === "pendingApproval" && (
                        <>
                          <button onClick={() => approveLeave(row)}>
                            <GiConfirmed className="text-green-600 hover:text-green-400" />
                          </button>
                        </>
                      )}
                      {status !== "past" && status !== "approved" && (
                        <button onClick={() => cancelPendingApprovalLeave(row)}>
                          <GiCancel className="text-red-600 hover:text-red-400" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

export default LeaveTable;
