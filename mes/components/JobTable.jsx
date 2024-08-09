"use client";
import React, { useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOrder } from "@/redux/orderSlice";
import { usePathname } from "next/navigation";
import { getWorkList } from "@/api/client/cOrderOperations";

const theme = createTheme({
  components: {
    MuiDataGrid: {
      styleOverrides: {
        columnHeaderTitle: {
          color: "white",
          fontWeight: "bold",
        },
        cell: {
          color: "white",
        },
        footerContainer: {
          backgroundColor: "lightgray",
          color: "black",
        },
        checkbox: {
          color: "white",
        },
      },
    },
  },
});

function JobTable() {
  const dispatch = useDispatch();
  const { selectedOrder, workList } = useSelector((state) => state.order);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { userInfo } = useSelector((state) => state.user);

  const handleSelectedRow = (params) => {
    if (params.row.id === selectedOrder?.id) {
      dispatch(setSelectedOrder(null));
    } else {
      dispatch(setSelectedOrder(params.row));
    }
  };

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 130,
      sortable: false,
    },
    { field: "user_id_dec", headerName: "Operator ID", width: 130 },
    { field: "op_username", headerName: "Operator Adi" , width:160 },
    { field: "order_no", headerName: "Order ID", width: 130 },
    { field: "process_id", headerName: "Process ID", width: 130 },
    {
      field: "section",
      headerName: "Bölüm",
      width: 130,
    },
    {
      field: "process_name",
      headerName: "Proses",
      sortable: false,
      width: 200,
    },
    { field: "production_amount", headerName: "Üretim Miktarı", width: 150 },
    { field: "work_start_date", headerName: "Başlama Zamanı", width: 200 },
    {
      field: "work_status",
      headerName: "Proses Durumu",
      width: 130,
      sortable: true,
    },
  ];

  useEffect(() => {
    let interval;

    const fetchData = () => {
      if (userInfo?.id_dec) {
        getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
      }
      console.log("veri çekildi...");
    };

    // İlk veri çekme işlemi
    fetchData();

    // Her 5 dakikada bir veri çekme işlemi
    interval = setInterval(fetchData, 5 * 60 * 1000); // 5 dakika = 5 * 60 * 1000 milisaniye

    // Bileşen unmount edildiğinde interval'i temizle
    return () => clearInterval(interval);
  }, [areaName, userInfo, dispatch]);


  console.log(workList)
  // status degerı 4 olmayan (bitmiş bir iş olmayan) işleri listeliyoruz.
  const rows = workList
    .filter((item) => item.work_status !== "4")
    .map((item, index) => {
      const workStartDate = item.work_start_date
        ? new Date(item.work_start_date)
        : null;
      return {
        id: index,
        user_id_dec: item.user_id_dec,
        op_username:item.op_username,
        order_no: item.order_no,
        process_id: item.process_id,
        section: item.section,
        area_name: item.area_name,
        process_name: item.process_name,
        produced_amount: item.produced_amount,
        production_amount: item.production_amount,
        work_start_date: workStartDate ? workStartDate.toLocaleString() : null,
        work_end_date: item.work_end_date,
        work_finished_op_dec: item.work_finished_op_dec,
        work_status: item.work_status,
        uniq_id: item.uniq_id,
      };
    });

  const getRowClassName = (params) => {
    const { row } = params;
    if (selectedOrder && row.id === selectedOrder.id) {
      return "selected-row";
    } else if (row.work_status === "1") {
      return "green-row";
    } else if (row.work_status === "2") {
      return "red-row";
    }
    return "";
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="w-full h-full rounded-md border-2 ">
        <DataGrid
          rows={rows}
          columns={columns}
          pagination={false}
          //checkboxSelection
          onRowClick={(params) => handleSelectedRow(params)}
          getRowClassName={getRowClassName}
        />
      </div>
    </ThemeProvider>
  );
}

export default JobTable;
