'use client'
import axios from "axios";
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Input from "@/components/ui/Input";
import { toast } from "react-toastify";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

function ExportSection() {
  const { filters, exportData } = useSelector((state) => state.dashboard);

  const rows = exportData?.length ? exportData : []; // export data dolu mu dolu ise rows parametresine ata

  // rows dolu ise sadece keyleri al 
  const initialHeaders = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return Object.keys(rows[0]);
  }, [rows]);

  const [headers, setHeaders] = useState(initialHeaders); // headers
  const [renaming, setRenaming] = useState(null); // düzenlenecek stunu tutacak state
  const [newName, setNewName] = useState(""); // yenı sutun ısmını tutacak state... 
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false)
  const handleDoubleClick = (key) => {
    setRenaming(key);
    setNewName(key);
  };

  const handleRename = () => {
    const updated = headers.map((h) => (h === renaming ? newName : h));
    setHeaders(updated);
    setRenaming(null);
  };

  // sutun silecek fonksiyon...
  const handleRemoveColumn = (keyToRemove) => {
    const updated = headers.filter(h => h !== keyToRemove);
    setHeaders(updated)
  };

  //! export to excell...
  const exportCustomExcell = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/export-data`,
        { headers, rows },
        {
          responseType: "blob", // 🔴 Burası şart! Axios’un dönen yanıtı binary olarak işlemesini sağlar
        }
      );
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // MIME tipiyle tarayıcının doğru şekilde indirmesini sağlar
      });

      const url = window.URL.createObjectURL(blob); // Geçici bir indirme adresi oluşturur
      const a = document.createElement("a");
      a.href = url;
      a.download = "ozel-export.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  //! sendExcelToMail
  const sendExcelToMail = async () => {
    try {
      if (!email) return toast.error("E-mail giriniz.");
      setLoading(true)
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics/send-export-mail`, {
        headers, rows, email
      });
      if (response.status === 200) {
        toast.success(`${response.data.message}`)
      }
      console.log(response)
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gönderim sırasında hata oluştu.");

    } finally {
      setLoading(false);
    }
  }

  console.log(email)
  return (
    <div className="p-6 bg-gray-50 h-full">
      <h2 className="text-xl font-bold text-blue-700 mb-6">📤 Dışa Aktarılacak Veriler</h2>
      <div className="w-full h-[80%] overflow-auto">
        <table className="min-w-full max-h-full border border-gray-300 text-sm shadow-sm rounded ">
          <thead className="bg-blue-100 text-blue-800">
            <tr>
              {headers.map((key) => (
                <th
                  key={key}
                  className="group p-3 border text-left font-semibold tracking-wide text-black cursor-pointer hover:bg-blue-200 transition relative"
                  onDoubleClick={() => handleDoubleClick(key)}
                >
                  <button onClick={() => handleRemoveColumn(key)} className="absolute top-0 right-0 text-red-600 p-1 opacity-0 group-hover:opacity-100 duration-150 transition-opacity">X</button>
                  {renaming === key ? (
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      onBlur={handleRename}
                      onKeyDown={(e) => e.key === "Enter" && handleRename()}
                      className="w-[120px] border border-gray-400 rounded px-2 py-1 text-xs text-black"
                      autoFocus
                    />
                  ) : (
                    <span className="text-xs ">{key.replace(/_/g, " ").toUpperCase()}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`${i % 2 === 0 ? "bg-white" : "bg-gray-100"
                  } hover:bg-yellow-50 transition`}
                style={{ height: "40px" }} // <— bu da eklenmeli
              >
                {headers.map((key) => (
                  <td
                    key={key}
                    className="p-0 border text-gray-700 text-sm"
                    style={{ height: "40px", maxHeight: "40px", overflow: "hidden" }}
                  >
                    <div
                      className="truncate whitespace-nowrap overflow-hidden flex items-center px-2"
                      style={{ lineHeight: "40px", height: "40px" }}
                    >
                      {String(row[key] ?? "")}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>


      <p className="text-sm text-gray-500 mt-4 italic">
        Toplam <strong>{rows.length}</strong> kayıt listelendi.
        Sütun başlığına <span className="text-blue-600 font-medium">çift tıklayarak</span> ismini değiştirebilirsiniz.
      </p>
      <p className="text-sm text-gray-500 mt-1 italic">
        Gereksiz sütunları <span className="text-red-600 font-medium">X</span> butonuna tıklayarak kaldırabilirsiniz.
      </p>
      <div className="flex gap-x-3 items-center">
        <button
          onClick={exportCustomExcell}
          className={`px-4 py-2  rounded shadow text-sm ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}`}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin"><AiOutlineLoading3Quarters /></span>
              Excel karsıya yükleniyor...
            </>
          ) : (
            "Excel Olarak İndir"
          )}
        </button>
        <Input
          placeholder={"E-posta giriniz."}
          addProps={"text-black"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type={"email"}
        />
        <button
          onClick={sendExcelToMail}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2 rounded shadow text-sm
    ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"}
  `}
        >
          {loading ? (
            <>
              <span className="animate-spin"><AiOutlineLoading3Quarters /></span>
              Gönderiliyor...
            </>
          ) : (
            "E-postaya Gönder"
          )}
        </button>

      </div>


    </div>
  );
}

export default ExportSection;
