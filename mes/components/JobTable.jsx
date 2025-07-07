"use client";
import React, { useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOrder } from "@/redux/orderSlice";
import { usePathname } from "next/navigation";
import { getWorkList } from "@/api/client/cOrderOperations";
import { getWorksWithoutId } from "@/redux/orderSlice";
import { areaSelectionConfig } from "@/utils/config/areaConfig";
import { setAreaName } from "@/redux/globalSlice";
import { useMemo } from "react";
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
  const {
    selectedOrder,
    workList,
    selectedHammerSectionField,
    selectedMachine,
  } = useSelector((state) => state.order);
  const { isRequiredUserId } = useSelector((state) => state.global);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { userInfo } = useSelector((state) => state.user);

  useEffect(() => {
    if (areaName) {
      dispatch(setAreaName(areaName)); // Redux'a areaName'i bildiriyoruz
    }
  }, [areaName]);

  // Tekli veya çoklu seçim yönetimi
  const handleRowSelection = (params) => {
    const { row } = params;
    const isSelected = selectedOrder?.some((item) => item.id === row.id);

    if (isSelected) {
      const updatedSelection = selectedOrder.filter(
        (item) => item.id !== row.id
      );
      dispatch(setSelectedOrder(updatedSelection));
      return;
    }

    if (areaSelectionConfig.singleSelect.includes(areaName)) {
      dispatch(setSelectedOrder([row]));
    } else if (areaSelectionConfig.multiSelect.includes(areaName)) {
      dispatch(setSelectedOrder([...selectedOrder, row]));
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
    { field: "op_username", headerName: "Operator Adi", width: 160 },
    { field: "order_no", headerName: "Order ID", width: 130 },
    { field: "old_code", headerName: "Eski Kod", width: 130 },
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
      const userId = userInfo?.id_dec;

      if (!isRequiredUserId && userId) {
        console.log("📢 getWorkList çalışıyor çünkü isRequiredUserId false");
        getWorkList({ areaName, userId, dispatch });
      } else if (isRequiredUserId) {
        console.log(
          "📢 getWorksWithoutId çalışıyor çünkü isRequiredUserId true"
        );
        dispatch(getWorksWithoutId({ areaName }));
      }
    };

    fetchData();
    interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [areaName, isRequiredUserId, userInfo, dispatch]);

  const mapRowData = (item, index) => {
    const workStartDate = item.work_start_date
      ? new Date(item.work_start_date)
      : null;
    return {
      id: item.uniq_id,
      user_id_dec: item.user_id_dec,
      op_username: item.op_username,
      order_no: item.order_no,
      old_code: item.old_code,
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
      group_no: item.group_no,
      group_record_id: item.group_record_id,
      machine_name: item.machine_name,
      field: item?.field,
    };
  };

  const shouldFilterByMachine = ["buzlama", "telcekme", "cekic"];
  const shouldFilterByHammer =
    areaName === "cekic" && selectedHammerSectionField !== "makine";

  const getFilteredRows = () => {
    let filteredList = [...workList];
    console.log("x", selectedMachine, isRequiredUserId);
    if (shouldFilterByMachine.includes(areaName)) {
      filteredList = filteredList.filter(
        (item) => item.machine_name === selectedMachine?.machine_name
      );
    }

    if (shouldFilterByHammer) {
      filteredList = filteredList.filter(
        (item) => item.field === selectedHammerSectionField
      );
    }
    return filteredList?.map(mapRowData);
  };

  const rows = useMemo(() => {
    return getFilteredRows();
  }, [workList, selectedMachine, selectedHammerSectionField]);
  // filtered rows for color
  const getRowClassName = (params) => {
    const { row } = params;

    if (selectedOrder?.some((item) => item.id === row.id))
      return "selected-row";

    switch (row.work_status) {
      case "1":
        return "green-row";
      case "2":
        return "red-row";
      case "9":
        return "red-row";
      case "0":
        return "bg-[#138d75]";
      case "6":
        return "yellow-row";
      case "7":
        return "bg-blue-600";
      default:
        return "";
    }
  };
  console.log({ worklist: workList });
  return (
    <ThemeProvider theme={theme}>
      <div className="w-full h-full rounded-md border-2 transition-all ease-in-out duration-300">
        <DataGrid
          rows={rows}
          columns={columns}
          pagination={false}
          //checkboxSelection
          onRowClick={(params) => handleRowSelection(params)}
          getRowClassName={getRowClassName}
        />
      </div>
    </ThemeProvider>
  );
}

export default JobTable;
