"use client";
import React, { useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedOrder } from "@/redux/orderSlice";
import { usePathname } from "next/navigation";
import { getWorkList } from "@/api/client/cOrderOperations";
import { getWorksWithoutId } from "@/redux/orderSlice";
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

  // Tekli veya çoklu seçim yönetimi
  const handleRowSelection = (params) => {
    const isSelected = selectedOrder?.some((item) => item.id === params.row.id);
    if (isSelected) {
      // Zaten seçili ise, kaldır
      const updatedSelection = selectedOrder.filter(
        (item) => item.id !== params.row.id
      );
      dispatch(setSelectedOrder(updatedSelection));
    } else {
      // Seçili değilse, ekle
      if (areaName === "kalite") {
        // Kalite ekranında sadece tek seçim yapılabilir
        dispatch(setSelectedOrder([params.row]));
      } else if (
        areaName === "buzlama" ||
        areaName === "cekic" ||
        areaName === "kurutiras" ||
        areaName === "telcekme" || 
        areaName === "cila"
      ) {
        // Buzlama ekranında çoklu seçim yapılabilir
        dispatch(setSelectedOrder([...selectedOrder, params.row]));
      }
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
      if ((areaName === "kalite" || areaName === "cila") && userInfo) {
        // ID ile siparişleri çek
        getWorkList({ areaName, userId: userInfo?.id_dec, dispatch });
      } else if (isRequiredUserId) {
        // ID olmadan tüm siparişleri çek
        dispatch(getWorksWithoutId({ areaName }));
      }
      console.log("veri çekildi...");
    };

    // İlk veri çekme işlemi
    fetchData();

    // Her 5 dakikada bir veri çekme işlemi
    interval = setInterval(fetchData, 5 * 60 * 1000); // 5 dakika = 5 * 60 * 1000 milisaniye

    // Bileşen unmount edildiğinde interval'i temizle
    return () => clearInterval(interval);
  }, [areaName, userInfo, dispatch, selectedHammerSectionField]);

  const getFilteredRows = () => {
    if (areaName === "buzlama" || areaName === "telcekme") {
      // Buzlama ekranı için filtreleme yap
      return workList
        ?.filter((item) => item.machine_name === selectedMachine.machine_name)
        .map((item, index) => {
          const workStartDate = item.work_start_date
            ? new Date(item.work_start_date)
            : null;
          return {
            id: index,
            user_id_dec: item.user_id_dec,
            op_username: item.op_username,
            order_no: item.order_no,
            old_code:item.old_code,
            process_id: item.process_id,
            section: item.section,
            area_name: item.area_name,
            process_name: item.process_name,
            produced_amount: item.produced_amount,
            production_amount: item.production_amount,
            work_start_date: workStartDate
              ? workStartDate.toLocaleString()
              : null,
            work_end_date: item.work_end_date,
            work_finished_op_dec: item.work_finished_op_dec,
            work_status: item.work_status,
            uniq_id: item.uniq_id,
            group_no: item.group_no,
            group_record_id: item.group_record_id,
            machine_name: item.machine_name,
          };
        });
    } else if (areaName === "kalite") {
      // Kalite ekranı için filtreleme yapma, tüm verileri göster
      return workList?.map((item, index) => {
        const workStartDate = item.work_start_date
          ? new Date(item.work_start_date)
          : null;
        return {
          id: index,
          user_id_dec: item.user_id_dec,
          op_username: item.op_username,
          order_no: item.order_no,
          old_code:item.old_code,
          process_id: item.process_id,
          section: item.section,
          area_name: item.area_name,
          process_name: item.process_name,
          produced_amount: item.produced_amount,
          production_amount: item.production_amount,
          work_start_date: workStartDate
            ? workStartDate.toLocaleString()
            : null,
          work_end_date: item.work_end_date,
          work_finished_op_dec: item.work_finished_op_dec,
          work_status: item.work_status,
          uniq_id: item.uniq_id,
          group_no: item.group_no,
          group_record_id: item.group_record_id,
        };
      });
    } else if (areaName === "cekic") {
      return workList
        ?.filter(
          (item) =>
            selectedHammerSectionField === "makine"
              ? item.machine_name === selectedMachine.machine_name // Eğer "makine" ise machine_name ile filtrele
              : item.field === selectedHammerSectionField // Değilse field ile filtrele
        )
        .map((item, index) => {
          const workStartDate = item.work_start_date
            ? new Date(item.work_start_date)
            : null;
          return {
            id: index,
            user_id_dec: item.user_id_dec,
            op_username: item.op_username,
            order_no: item.order_no,
            process_id: item.process_id,
            section: item.section,
            area_name: item.area_name,
            process_name: item.process_name,
            produced_amount: item.produced_amount,
            production_amount: item.production_amount,
            work_start_date: workStartDate
              ? workStartDate.toLocaleString()
              : null,
            work_end_date: item.work_end_date,
            work_finished_op_dec: item.work_finished_op_dec,
            work_status: item.work_status,
            uniq_id: item.uniq_id,
            group_no: item.group_no,
            group_record_id: item.group_record_id,
            field: item?.field,
          };
        });
    } else {
      // Diğer durumlar için (örneğin "cekic") varsayılan davranış
      return workList?.map((item, index) => {
        const workStartDate = item.work_start_date
          ? new Date(item.work_start_date)
          : null;
        return {
          id: index,
          user_id_dec: item.user_id_dec,
          op_username: item.op_username,
          order_no: item.order_no,
          old_code:item.old_code,
          process_id: item.process_id,
          section: item.section,
          area_name: item.area_name,
          process_name: item.process_name,
          produced_amount: item.produced_amount,
          production_amount: item.production_amount,
          work_start_date: workStartDate
            ? workStartDate.toLocaleString()
            : null,
          work_end_date: item.work_end_date,
          work_finished_op_dec: item.work_finished_op_dec,
          work_status: item.work_status,
          uniq_id: item.uniq_id,
          group_no: item.group_no,
          group_record_id: item.group_record_id,
        };
      });
    }
  };

  const rows = getFilteredRows();
  const getRowClassName = (params) => {
    const { row } = params;
    // Seçili satırların stilini belirle
    if (selectedOrder?.some((item) => item.id === row.id)) {
      return "selected-row";
    }
    // İş durumuna göre stil ayarlama
    if (row.work_status === "1") {
      return "green-row";
    } else if (row.work_status === "2") {
      return "red-row";
    } else if (row.work_status === "0") {
      return "bg-[#138d75]";
    } else if (row.work_status === "6") {
      return "yellow-row";
    } else if (row.work_status === "0") {
      return "grey-row";
    } else if (row.work_status === "7") {
      return "bg-blue-600";
    }
    return "";
  };

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
