import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

function LeaveTable() {
  const { userInfo } = useSelector((state) => state.user);
  const [pendingRec, setPendingRec] = useState(null);
  
  useEffect(() => {
    const fetchPendingRec = async () => {
      const { id_dec } = userInfo;
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/getLeaveRecordsById`,
          { id_dec }
        );
        setPendingRec(response.data);
      } catch (err) {
        console.log(err);
      }
    };

    fetchPendingRec();
  }, [userInfo]);

  const columns = [
    {
      headerName: "Kullanici İsmi",
      className: "text-center border-r  py-5 text-left text-xs font-medium uppercase tracking-wider",
    },
    {
      headerName: "Kullanici İd",
      className: "text-center border-r  py-3 text-left text-xs font-medium uppercase tracking-wider",
    },
    {
      headerName: "İzin Başlangıc Tarihi",
      className: "text-center border-r  py-3 text-left text-xs font-medium uppercase tracking-wider",
    },
    {
      headerName: "İşe Dönüş Tarihi",
      className: "text-center border-r  py-3 text-left text-xs font-medium uppercase tracking-wider",
    },
    {
      headerName: "İzin Nedeni",
      className: "text-center border-r  py-3 text-left text-xs font-medium uppercase tracking-wider",
    },
    {
      headerName: "İzin Durumu",
      className: "text-center border-r  py-3 text-left text-xs font-medium uppercase tracking-wider",
    },
  ];

  const rows = pendingRec && pendingRec
    .filter((item) => item.leave_status === "1")
    .map((item, index) => ({
      name: item.op_username,
      id: item.id_dec,
      leave_start_date: item.leave_start_date,
      leave_end_date: item.leave_end_date,
      leave_reason: item.leave_reason,
      leave_status: item.leave_status,
    }));

  return (
    <div className="h-[80%] w-full">
      <table className="bg-slate-600 w-full shadow-xl">
        <thead className="bg-secondary text-black">
          <tr className="px-2">
            {columns.map((column, index) => (
              <th key={index} className={`${column.className}`}>{column.headerName}</th>
            ))}
          </tr>
        </thead>
        <tbody className="max-h-[400px] overflow-y-scroll">
          {rows && rows.map((row, index) => {
            const date = new Date(row.leave_start_date);
            const formattedDate = date.toLocaleDateString(); 
            const formattedTime = date.toLocaleTimeString(); 
            
            const dateEnd = new Date(row.leave_end_date);
            const formattedEndDate = dateEnd.toLocaleDateString();
            const formattedEndTime = dateEnd.toLocaleTimeString();
             return(
              <tr key={index} className="h-[50px]">
              <td className=" border-r text-center   py-3 whitespace-nowrap">{row.name}</td>
              <td className="text-center border-r  py-3 whitespace-nowrap">{row.id}</td>
              <td className="text-center border-r  py-3 whitespace-nowrap">{formattedDate} - {formattedTime}</td>
              <td className="text-center border-r  py-3 whitespace-nowrap">{formattedEndDate} - {formattedEndTime}</td>
              <td className="text-center border-r  py-3 whitespace-nowrap">{row.leave_reason}</td>
              <td className="text-center border-r  py-3 whitespace-nowrap">{row.leave_status}</td>
            </tr>
            )
})}
        </tbody>
      </table>
    </div>
  );
}

export default LeaveTable;
