import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material";
import { setSelectionShift } from "@/redux/shiftSlice";

function ShiftTable() {
  const { userInfo, allUser } = useSelector((state) => state.user);
  const { usersOnShifts, selection_shift } = useSelector(
    (state) => state.shift
  );
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

  const rows = useMemo(() => {
    if (usersOnShifts.length > 0 && allUser.length > 0) {
      return usersOnShifts.map((item) => {
        const a = allUser.find((u) => u.id_dec === item.operator_id);
        const status = () => {
          if (item.shift_status === "1") {
            return "Onay Bekliyor";
          } else if (item.shift_status === "2") {
            return "İptal Edildi";
          } else if (item.shift_status === "3") {
            return "Onaylandı";
          } else if (item.shift_status === "4") {
            return "Sabah Servisi";
          } else if (item.shift_status === "5") {
            return "Akşam Servisi";
          }
        };
        return {
          id: item.shift_uniq_id,
          service_key: item.service_key,
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
      });
    }
    return [];
  }, [usersOnShifts, allUser]);

  const columns = [
    { field: "op_id", headerName: "İd", width: 150 },
    { field: "service_key", headerName: "Servis No", width: 150 },
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

  function handleSelectedRow(params) {
    const { row } = params;
    const isSelected = selection_shift.some(
      (selectedRow) => selectedRow.id === row.id
    );

    if (isSelected) {
      dispatch(
        setSelectionShift(
          selection_shift.filter((selectedRow) => selectedRow.id !== row.id)
        )
      );
    } else {
      dispatch(setSelectionShift([...selection_shift, row]));
    }
  }

  const getRowClassName = (params) => {
    const { row } = params;
    const isSelected = selection_shift.some(
      (selectedRow) => selectedRow.id === row.id
    );

    if (isSelected) {
      return "selected-row";
    }

    if (row.shift_status === "Onay Bekliyor") {
      return "shift-row";
    } else if (row.shift_status === "Onaylandı") {
      return "green-row";
    } else if (row.shift_status === "Sabah Servisi") {
      return "bg-[#A6AEBF]";
    } else if (row.shift_status === "Akşam Servisi") {
      return "bg-[#C5D3E8]";
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
          sx={{
            "& .MuiDataGrid-main": {
              backgroundColor: "#a6aebf", // Boş alan arka plan rengi
            },
            "& .MuiDataGrid-virtualScroller": {
              backgroundColor: "#a6aebf", // Boş alanın scroll kısmı
            },
            "& .MuiDataGrid-toolbarContainer": {
              backgroundColor: "#A6AEBF", // Toolbar kısmının arka plan rengi
              color: "white", // Toolbar yazı rengi
            },
            "& .MuiButtonBase-root": {
              color: "white", // Toolbar içindeki butonların yazı rengi
            },
          }}
        />
      </div>
    </ThemeProvider>
  );
}

export default ShiftTable;
