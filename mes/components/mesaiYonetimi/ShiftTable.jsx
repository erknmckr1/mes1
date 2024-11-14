import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import { MdCancel } from "react-icons/md";

function ShiftTable() {
  const { userInfo, allUser } = useSelector((state) => state.user);
  const { usersOnShifts } = useSelector((state) => state.shift);
  const [selectionModel, setSelectionModel] = useState([]);
  const columns = [
    { field: "op_id", headerName: "İd", width: 200 },
    {
      field: "cancel",
      headerName: "İptal",
      width: 75,
      renderCell: (params) => (
        <button
          onClick={() => handleCancel(params.row)}
          className="bg-red-500 text-center text-white px-2 py-1 rounded hover:bg-red-700"
        >
          <MdCancel />
        </button>
      ),
    },
    { field: "name", headerName: "Kullanici İsmi", width: 200 },
    { field: "title", headerName: "Ünvan", width: 200 },
    { field: "stop_name", headerName: "Durak", width: 200 },
    { field: "address", headerName: "Adres", width: 200 },
    { field: "section", headerName: "Bölüm", width: 200 },
    { field: "part", headerName: "Birim", width: 200 },
    { field: "start_shift", headerName: "Baslangıc Tarihi", width: 200 },
    { field: "start_time", headerName: "Baslangıc Saati", width: 200 },
    { field: "shift_status", headerName: "Mesai Durumu", width: 200 },
  ];
    // Tıklanan satırın bıglılerını tutacak fonksıyon...
    function handleSelectedRow(params) {
      const { id } = params.row;
      setSelectionModel((prevSelectionModel) => {
        if (prevSelectionModel.includes(id)) {
          return prevSelectionModel.filter((item) => item !== id);
        } else {
          return [...prevSelectionModel, id];
        }
      });
    }
  
    const getRowClassName = (params) => {
      const { row } = params;
      if (selectionModel?.some((item) => item === row.id)) {
        return "selected-row";
      }
      if (row.shift_status === "1") {
        return "shift-row";
      }
    };
  const rows =
    usersOnShifts.length > 0 && allUser.length > 0
      ? usersOnShifts.map((item) => {
          const a = allUser.find((u) => u.id_dec === item.operator_id);
          console.log("Bulunan Kullanıcı:", a);
          return {
            id: item.shift_uniq_id,
            cancel: (
              <button>
                <MdCancel />
              </button>
            ),
            name: a?.op_username || "Bilinmiyor",
            title: a?.title || "Bilinmiyor",
            part: a?.part || "Bilinmiyor",
            stop_name: a?.stop_name || "Bilinmiyor",
            address: a?.address || "Bilinmiyor",
            section: a?.op_section || "Bilinmiyor",
            op_id: item.operator_id,
            start_shift: item.start_date,
            start_time: item.start_time,
            shift_status: item.shift_status,
          };
        })
      : [];
  return (
      <Box width={1200} height={600}>
          <DataGrid
            columns={columns}
            rows={rows}
            rowHeight={38}
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
        </Box>
  )
}

export default ShiftTable
