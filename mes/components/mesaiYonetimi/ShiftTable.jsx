import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material";
import { MdCancel } from "react-icons/md";
import { fetchShiftLogs } from "@/redux/shiftSlice";
import { toast } from "react-toastify";

function ShiftTable({selectionModel,setSelectionModel}) {
  const { userInfo, allUser } = useSelector((state) => state.user);
  const { usersOnShifts } = useSelector((state) => state.shift);

  const dispatch = useDispatch();

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

  const rows =
    usersOnShifts.length > 0 && allUser.length > 0
      ? usersOnShifts.map((item) => {
          const a = allUser.find((u) => u.id_dec === item.operator_id);
          const status = () => {
            if (item.shift_status === "1") {
              return "Onay Bekliyor";
            } else if (item.shift_status === "2") {
              return "İptal Edildi";
            } else if (item.shift_status === "3") {
              return "Onaylandı";
            }
          };
          return {
            id: item.shift_uniq_id,
            op_id: item.operator_id,
            name: a?.op_username || "Bilinmiyor",
            title: a?.title || "Bilinmiyor",
            part: a?.part || "Bilinmiyor",
            stop_name: a?.stop_name || "Bilinmiyor",
            address: a?.address || "Bilinmiyor",
            section: a?.op_section || "Bilinmiyor",
            start_shift: item.start_date,
            start_time: item.start_time,
            shift_status: status(),
            uniq_id: item.shift_uniq_id,
          };
        })
      : [];

  // İptal butonunu render etmek için columns kısmında renderCell kullanmalısınız
  const columns = [
    { field: "op_id", headerName: "İd", width: 150 },
    { field: "name", headerName: "Kullanici İsmi", width: 200 },
    { field: "title", headerName: "Ünvan", width: 200 },
    { field: "stop_name", headerName: "Durak", width: 200 },
    { field: "address", headerName: "Adres", width: 200 },
    { field: "section", headerName: "Bölüm", width: 200 },
    { field: "part", headerName: "Birim", width: 150 },
    { field: "start_shift", headerName: "Baslangıc Tarihi", width: 200 },
    { field: "start_time", headerName: "Baslangıc Saati", width: 200 },
    { field: "shift_status", headerName: "Mesai Durumu", width: 200 },
  ];

  // Tıklanan satırın bıglılerını tutacak fonksıyon...
  function handleSelectedRow(params) {
    const { row } = params;
    setSelectionModel((prevSelectionModel) => {
      const isSelected = prevSelectionModel.some(
        (selectedRow) => selectedRow.id === row.id
      );

      if (isSelected) {
        // Eğer zaten seçiliyse, çıkart
        return prevSelectionModel.filter(
          (selectedRow) => selectedRow.id !== row.id
        );
      } else {
        // Eğer seçili değilse, ekle
        return [...prevSelectionModel, row];
      }
    });
  }

  const getRowClassName = (params) => {
    const { row } = params;
    const isSelected = selectionModel.some(
      (selectedRow) => selectedRow.id === row.id
    );

    if (isSelected) {
      return "selected-row";
    }

    if (row.shift_status === "Onay Bekliyor") {
      return "shift-row";
    } else if (row.shift_status === "Onaylandı") {
      return "green-row";
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <div className="w-full h-full rounded-md border-2 transition-all ease-in ">
        <DataGrid
          columns={columns}
          rows={rows}
          rowHeight={50}
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
          onRowClick={handleSelectedRow}
          getRowClassName={getRowClassName}
        />
      </div>
    </ThemeProvider>
  );
}

export default ShiftTable;
