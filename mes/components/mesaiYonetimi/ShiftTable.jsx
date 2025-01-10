import React, { useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material";
import { setSelectionShift } from "@/redux/shiftSlice";
import { usePathname } from "next/navigation";
function ShiftTable() {
  const { userInfo, allUser } = useSelector((state) => state.user);
  const pathname = usePathname();
  const url = pathname.split("/");

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

  const getStatus = (shiftStatus) => {
    switch (shiftStatus) {
      case "1":
        return "Onay Bekliyor";
      case "2":
        return "İptal Edildi";
      case "3":
        return "Onaylandı";
      case "4":
        return "Sabah Servisi";
      case "5":
        return "Aksam Servisi";
      default:
        return "Bilinmiyor";
    }
  };

  const rows = useMemo(() => {
    if (usersOnShifts.length > 0 && allUser.length > 0) {
      // Filtreleme: url[3] === "idariisler" ise status 1 ve 2'yi hariç tut
      const filteredShifts =
        url[3] === "idariisler"
          ? usersOnShifts.filter(
              (item) => item.shift_status !== "1" && item.shift_status !== "2"
            )
          : usersOnShifts;

      // Satırları dönüştür
      const mappedRows = filteredShifts.map((item) => {
        const a = allUser.find((u) => u.id_dec === item.operator_id);
        return {
          id: item.shift_uniq_id, // Benzersiz ID
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
          shift_status: getStatus(item.shift_status), // Status fonksiyonundan alınan değer
          uniq_id: item.shift_uniq_id,
          service_period: item.service_period,
        };
      });

      // Sıralama: shift_status '1' olanlar en başta
      const sortedRows = mappedRows.sort((a, b) => {
        if (
          a.shift_status === "Onay Bekliyor" &&
          b.shift_status !== "Onay Bekliyor"
        ) {
          return -1; // 'Onay Bekliyor' olanlar öne alınır
        } else if (
          a.shift_status !== "Onay Bekliyor" &&
          b.shift_status === "Onay Bekliyor"
        ) {
          return 1; // 'Onay Bekliyor' olmayanlar sona alınır
        }
        return 0; // Diğer durumlar sıralamada değişiklik yapmaz
      });

      return sortedRows;
    }
    return [];
  }, [usersOnShifts, allUser, url]);

  const columns = [
    { field: "op_id", headerName: "İd", width: 150 },
    { field: "shift_status", headerName: "Mesai Durumu", width: 200 },
    { field: "service_key", headerName: "Servis No", width: 150 },
    { field: "name", headerName: "Kullanici İsmi", width: 200 },
    { field: "title", headerName: "Ünvan", width: 200 },
    { field: "stop_name", headerName: "Durak", width: 200 },
    { field: "address", headerName: "Adres", width: 200 },
    { field: "section", headerName: "Bölüm", width: 200 },
    { field: "part", headerName: "Birim", width: 150 },
    { field: "start_shift", headerName: "Baslangıc Tarihi", width: 200 },
    { field: "start_time", headerName: "Baslangıc Saati", width: 200 },

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
    } else if (row.shift_status === "Aksam Servisi") {
      return "bg-black";
    } else if (row.shift_status === "Sabah Servisi") {
      return "bg-[#85c1e9]";
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
