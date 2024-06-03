"use client";
import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOrder } from "@/redux/orderSlice";

const columns = [
  { field: "id", headerName: "Operator ID", width: 130 },
  { field: "orderid", headerName: "Order ID", width: 130 },
  { field: "processid", headerName: "Process ID", width: 130 },
  {
    field: "section",
    headerName: "Section",
    width: 90,
  },
  {
    field: "worktype",
    headerName: "Work_Type",
    sortable: false,
    width: 160,
  },
  { field: "producedamount", headerName: "Produced Amount", width: 130 },
  { field: "start_date", headerName: "Başlama Zamanı", width: 130 },
  { field: "end_date", headerName: "Bitiş Zamanı", width: 130 },
  { field: "finished_op", headerName: "Bitiren Operator", width: 130 },
];

const rows = [
  {
    id: 1,
    orderid: "O001",
    processid: "P001",
    section: "A",
    worktype: "Welding",
    producedamount: 100,
    start_date: "2024-06-01",
    end_date: "2024-06-02",
    finished_op: "Jon",
  },
  {
    id: 2,
    orderid: "O002",
    processid: "P002",
    section: "B",
    worktype: "Cutting",
    producedamount: 200,
    start_date: "2024-06-03",
    end_date: "2024-06-04",
    finished_op: "Cersei",
  },
  {
    id: 3,
    orderid: "O003",
    processid: "P003",
    section: "A",
    worktype: "Assembling",
    producedamount: 150,
    start_date: "2024-06-05",
    end_date: "2024-06-06",
    finished_op: "Jaime",
  },
  {
    id: 4,
    orderid: "O004",
    processid: "P004",
    section: "C",
    worktype: "Painting",
    producedamount: 120,
    start_date: "2024-06-07",
    end_date: "2024-06-08",
    finished_op: "Arya",
  },
  {
    id: 5,
    orderid: "O005",
    processid: "P005",
    section: "D",
    worktype: "Inspection",
    producedamount: 80,
    start_date: "2024-06-09",
    end_date: "2024-06-10",
    finished_op: "Daenerys",
  },
  {
    id: 6,
    orderid: "O006",
    processid: "P006",
    section: "A",
    worktype: "Packaging",
    producedamount: 110,
    start_date: "2024-06-11",
    end_date: "2024-06-12",
    finished_op: "Melisandre",
  },
  {
    id: 7,
    orderid: "O007",
    processid: "P007",
    section: "B",
    worktype: "Transporting",
    producedamount: 90,
    start_date: "2024-06-13",
    end_date: "2024-06-14",
    finished_op: "Ferrara",
  },
  {
    id: 8,
    orderid: "O008",
    processid: "P008",
    section: "C",
    worktype: "Loading",
    producedamount: 140,
    start_date: "2024-06-15",
    end_date: "2024-06-16",
    finished_op: "Rossini",
  },
  {
    id: 9,
    orderid: "O009",
    processid: "P009",
    section: "D",
    worktype: "Unloading",
    producedamount: 130,
    start_date: "2024-06-17",
    end_date: "2024-06-18",
    finished_op: "Harvey",
  },
];

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

function CustomFooter() {
    const selectedOrder = useSelector((state) => state.order.selectedOrder);
  
    return (
      <div style={{ padding: "10px", backgroundColor: "lightgray", color: "black" }}>
        {selectedOrder ? (
          <>
            <p>Selected Order ID: {selectedOrder.orderid}</p>
            <p>Operator ID: {selectedOrder.id}</p>
            <p>Process ID: {selectedOrder.processid}</p>
            <p>Section: {selectedOrder.section}</p>
            <p>Work Type: {selectedOrder.worktype}</p>
            <p>Start Date: {selectedOrder.start_date}</p>
  
          </>
        ) : (
          <p>No order selected</p>
        )}
      </div>
    );
  }

function JobTable() {
  const dispatch = useDispatch();
  const selectedOrder = useSelector((state) => state.order.selectedOrder);

  const handleSelectedRow = (params) => {
    if (params.row.id === selectedOrder?.id) {
      dispatch(setSelectedOrder(null));
    } else {
      dispatch(setSelectedOrder(params.row));
    }
  };
  console.log(selectedOrder);
  return (
    <ThemeProvider theme={theme}>
      <div className="w-full h-full rounded-md border-2 border-secondary">
        <DataGrid
          rows={rows}
          columns={columns}
          pagination={true}
          // checkboxSelection
          onRowClick={(params) => handleSelectedRow(params)}
          getRowClassName={(params) =>
            params.id === selectedOrder?.id ? "selected-row" : ""
          }
        />
        
      </div>
      
    </ThemeProvider>
  );
}







export default JobTable;
