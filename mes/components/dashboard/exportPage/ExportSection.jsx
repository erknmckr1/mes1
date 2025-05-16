'use client'
import React, { useMemo } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { useSelector } from "react-redux";

function ExportSection() {
  const { exportData } = useSelector((state) => state.dashboard);

  // Eğer veri yoksa boş dizi göster
  const rows = exportData?.length ? exportData : [];

  // Sütunları dinamik olarak oluştur
  const columns = useMemo(() => {
  if (!rows || rows.length === 0) return [];

  const sample = rows[0];
  return Object.keys(sample).map((key) => ({
    field: key,
    headerName: key.replace(/_/g, " ").toUpperCase(),
    minWidth: 150,
    flex: 0, // sabit genişlik olsun istiyorsan flex 0 yap
  }));
}, [rows]);


  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Dışa Aktarılacak Veriler</h2>
      <DataGrid
        rows={rows.map((row, index) => ({ ...row, id: row.id || index }))} // id zorunlu
        columns={columns}
        pageSize={20}
        autoHeight
        disableRowSelectionOnClick
        getRowId={(row) => row.id || row.uniq_id || row.order_no || index} // fallback'li id seçimi
      />
    </div>
  );
}

export default ExportSection;
