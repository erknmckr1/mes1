import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ThemeProvider, createTheme } from "@mui/material";
import { setSelectedShiftUser } from "@/redux/shiftSlice";
function UserTable() {
  const { userInfo, allUser } = useSelector((state) => state.user);
  const { selectedShiftUser } = useSelector((state) => state.shift);
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

  const columns = [
    { field: "id_dec", headerName: "ID", width: 150 },
    { field: "op_username", headerName: "Ad", width: 150 },
    { field: "title", headerName: "Ünvan", width: 150 },
    { field: "op_section", headerName: "Bölüm", width: 150 },
    { field: "part", headerName: "Birim", width: 150 },
    { field: "stop_name", headerName: "Durak", width: 150 },
  ];

  const rows = allUser.map((user, index) => ({
    id: index + 1, // DataGrid'e özel benzersiz bir id (zorunlu)
    id_dec: user.id_dec,
    op_username: user.op_username,
    title: user.title,
    op_section: user.op_section,
    part: user.part,
    stop_name: user.stop_name || "Belirtilmedi", // Null ise varsayılan değer
  }));

  // tabloya tıkladııgmız satırda params nesnesını yolluyoruz. Params ın row ozellıgı tıkladıgımız satırın bılgılerını tutar. 
  const getRowClassName = (params) => {
    const { row } = params;

    const isSelected = selectedShiftUser.some(
      (selectedRow) => selectedRow.id_dec === row.id_dec
    );

    if (isSelected) {
      return "selected-row";
    } else {
      return "bg-[#566573]";
    }
  };

  const handleSelectedRow = (params) => {
    const { row } = params;
    const isSelected = selectedShiftUser.some(
      (selectedRow) => selectedRow.id_dec === row.id_dec
    );
    if (isSelected) {
      // Eğer seçiliyse, Redux state'den çıkar
      dispatch(
        setSelectedShiftUser(
          selectedShiftUser.filter(
            (selectedRow) => selectedRow.id_dec !== row.id_dec
          )
        )
      );
    } else {
      dispatch(setSelectedShiftUser([...selectedShiftUser, row]));
    }
  };
  

  return (
    <ThemeProvider theme={theme}>
      <div className="w-full h-full rounded-md border-2 transition-all ease-in ">
        <DataGrid
          columns={columns}
          rowHeight={50}
          rows={rows}
          getRowClassName={getRowClassName}
          onRowClick={handleSelectedRow}
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
              quickFilterProps: {
                style: {
                  width: "100px",
                  // padding: "5px",
                },
              },
            },
          }}
          pageSizeOptions={[10, 30, 50, 100]}
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

export default UserTable;
