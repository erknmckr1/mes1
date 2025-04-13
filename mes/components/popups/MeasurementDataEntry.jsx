import React from "react";
import {
  setFilteredGroup,
  setMeasurementPopup,
  setSelectedGroupNos,
} from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import Button from "../ui/Button";
import { DataGrid } from "@mui/x-data-grid";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useState, useEffect } from "react";
import Input from "../ui/Input";
import axios from "axios";
import { toast } from "react-toastify";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { setUser } from "@/redux/userSlice";

function MeasurementDataEntry() {
  const [formState, setFormState] = useState({
    orderId: "", // String olarak kalıyor
    entryMeasurement: 0, // Sayısal başlangıç değeri
    exitMeasurement: 0, // Sayısal başlangıç değeri
    entryGramage: 0.0, // Sayısal başlangıç değeri
    exitGramage: null, // Sayısal başlangıç değeri
    gramage: 0.0, // Sayısal başlangıç değeri
    quantity: 0.0, // Sayısal başlangıç değeri
  });

  const [selectedRow, setSelectedRow] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [measure50Cm, setMeasure50Cm] = useState(null);
  const [isOutOfRange, setIsOutOfRange] = useState(false); // rangeın durumunu tutacak state
  const [allMeasurement, setAllMeasurement] = useState([]);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { userInfo, user } = useSelector((state) => state.user);
  const { theme } = useSelector((state) => state.global);

  const handleClosePopup = () => {
    dispatch(setMeasurementPopup(false));
    dispatch(setSelectedGroupNos([]));
    dispatch(setFilteredGroup([]));
    setOrderData(null);
    dispatch(setUser(null));
  };
  const { selectedGroupNo } = useSelector((state) => state.order);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Eğer sayı beklenen bir alan ise değeri sayıya çeviriyoruz
    const convertedValue =
      name === "entryGramage" ||
      name === "exitGramage" ||
      name === "gramage" ||
      name === "quantity"
        ? parseFloat(value) || 0 // Eğer geçerli bir sayı değilse 0 yap
        : value; // Diğer alanlar için olduğu gibi bırak

    setFormState({
      ...formState,
      [name]: convertedValue,
    });
  };

  //olcu aralıgını render edecek...
  useEffect(() => {
    if (measure50Cm && formState.exitGramage !== null) {
      if (
        formState.exitGramage < measure50Cm.lowerLimit ||
        formState.exitGramage > measure50Cm.upperLimit
      ) {
        setIsOutOfRange(true); // Aralık dışıysa uyarıyı göster
      } else {
        setIsOutOfRange(false); // Aralıkta ise uyarıyı kaldır
      }
    }
  }, [formState.exitGramage, measure50Cm]); // exitGramage ve measure50Cm her değiştiğinde çalışır

  //! metarıal no ıle olcum verısı cekecek query
  const handleGetMeasureWithMetarialNo = async () => {
    try {
      const response3 = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getMeasureWithOrderId`,
        {
          params: {
            areaName,
            material_no: orderData.MATERIAL_NO, // material_no'yu orderData'dan kullanıyoruz
          },
        }
      );
      if (response3.status === 200) {
        if (Array.isArray(response3.data) && response3.data.length > 0) {
          setAllMeasurement(response3.data);
        } else {
          toast.info("Geçmiş ölçüm verisi bulunamadı.");
          setAllMeasurement(null);
        }
      } else {
        toast.error("Geçmiş ölçüm verisi çekilemedi.");
        setAllMeasurement(null);
      }
    } catch (error) {
      console.log(error);
    }
  };

  //! Okutulan siparişi v bu sipariş için malzeme olcum aralıgını çekecek query...
  const handleGetOrderById = async () => {
    console.log(formState.orderId);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getOrderById`,
        {
          params: {
            orderId: formState.orderId,
          },
        }
      );

      console.log("İlk response:", response.data); // İlk çağrıda gelen veriyi kontrol edin

      if (response.status === 200) {
        toast.success("Sipariş başarıyla okutuldu...");
        setOrderData(response.data); // Veriyi state'e setliyoruz
        console.log(response.data.MATERIAL_NO);

        // İkinci API çağrısı - getMetarialMeasureData malzemenın ölçüm aralıgını al.
        const response2 = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getMetarialMeasureData`,
          {
            params: {
              metarial_no: response.data.MATERIAL_NO, // Direk response.data kullanıyoruz
            },
          }
        );

        console.log("İkinci response:", response2.data); // İkinci çağrıda gelen veriyi kontrol edin

        if (response2.status === 200 && response2.data) {
          setMeasure50Cm(response2.data);
          if (!response2.data) {
            toast.error(
              "Malzeme no belirtildi, ancak ölçüm aralığı bulunamadı."
            );
          }
        } else {
          toast.error("Ölçü aralığı bulunamadı.");
        }

        // Üçüncü API çağrısı - getMeasureWithOrderId
        const response3 = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getMeasureWithOrderId`,
          {
            params: {
              areaName,
              material_no: response.data.MATERIAL_NO, // material_no'yu orderData'dan kullanıyoruz
            },
          }
        );

        console.log("Üçüncü response:", response3.data); // Üçüncü çağrıda gelen veriyi kontrol edin

        if (response3.status === 200) {
          if (Array.isArray(response3.data) && response3.data.length > 0) {
            setAllMeasurement(response3.data);
          } else {
            toast.info("Geçmiş ölçüm verisi bulunamadı.");
          }
        } else {
          toast.error("Geçmiş ölçüm verisi çekilemedi.");
        }
      } else {
        toast.error("Sipariş bilgileri çekilemedi, böyle bir sipariş yok.");
      }
    } catch (err) {
      toast.error(err.response?.data ? err.response.data : err.message);
    }
  };

  // tablodan veri seç...
  const handleRowSelection = (params) => {
    // sipariş seçili mi ?
    const isSelected = selectedRow?.some((item) => item.id === params.row.id);

    if (isSelected) {
      const updatedSelection = selectedRow.filter(
        (item) => item.id !== params.row.id
      );
      setSelectedRow(updatedSelection);
    } else {
      setSelectedRow([params.row]);
    }
  };
  //! Verı kaydı isteği...
  const handleSumbit = async () => {
    if (!orderData || orderData?.length === 0) {
      toast.error("Okutulan sipariş hatalı, sipariş bulunamadı.");
      return;
    }

    const measurementsInfo = {
      order_no: orderData?.ORDER_ID,
      material_no: orderData?.MATERIAL_NO,
      operator: user?.id_dec,
      area_name: areaName,
      entry_measurement: formState.entryMeasurement,
      exit_measurement: formState.exitMeasurement,
      entry_weight_50cm: formState.entryGramage,
      exit_weight_50cm: formState.exitGramage,
      data_entry_date: "",
      description: orderData?.ITEM_DESCRIPTION,
      measurement_package: formState.quantity,
      // group_no: selectedGroupNo[0].group_no,
    };
    try {
      let response;

      if (!measurementsInfo.entry_measurement) {
        toast.error("Giriş ölçümü alanı doldurulmalıdır.");
        return;
      }

      if (!measurementsInfo.entry_weight_50cm) {
        toast.error("Giriş gramajı alanı doldurulmalıdır.");
        return;
      }

      if (!measurementsInfo.exit_weight_50cm) {
        toast.error("Çıkıs gramajı alanı doldurulmalıdır.");
        return;
      }

      response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/measurements`,
        measurementsInfo
      );

      if (response.status === 200) {
        toast.success("Veriler başarıyla kaydedildi!");
        setFormState({
          order_no: "",
          material_no: "",
          operator: "",
          area_name: "",
          entry_measurement: "",
          exit_measurement: "",
          entry_weight_50cm: 0.0,
          exit_weight_50cm: 0.0,
          data_entry_date: "",
          description: "",
          measurement_package: 0.0,
        });
        handleGetMeasureWithMetarialNo();
        setIsOutOfRange(false);
        setMeasure50Cm(null);
      }
    } catch (err) {
      toast.error(err.response ? err.response.data : "");
      console.log(err);
    }
  };
  //! secılı olcumu sılecek(status u degıstırecek) query...
  const handleDeletedMeasure = async () => {
    console.log(selectedRow);
    if (selectedRow === null || selectedRow.length <= 0) {
      toast.error("Silmek istediğiniz ölçüyü seçin.");
      return;
    }

    try {
      const { area_name, order_no, id } = selectedRow[0];
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/deleteMeasurement`,
        { area_name, order_no, id, user: user.id_dec }
      );

      if (response.status === 200) {
        toast.success("Ölçüm basarıyla silindi");
        await handleGetMeasureWithMetarialNo();
      }
    } catch (err) {
      console.log(err);
    }
  };

  // formu temızleyecek state...
  // const handleDeleteForm = () => {
  //   setFormState({
  //     order_no: "",
  //     material_no: "",
  //     operator: "",
  //     area_name: "",
  //     entry_measurement: "",
  //     exit_measurement: "",
  //     entry_weight_50cm: 0.0,
  //     exit_weight_50cm: null,
  //     data_entry_date: "",
  //     description: "",
  //     measurement_package: 0.0,
  //   });

  //   console.log(formState);
  // };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGetOrderById();
    }
  };

  const themes = createTheme({
    components: {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            color: "white", // Tüm metinleri beyaz yapar
            backgroundColor: "#566573", // Arka plan rengini koyu yapar
          },
          cell: {
            "& .MuiDataGrid-cell": {
              color: "white", // Her bir hücredeki metni beyaz yapar
            },
          },
          columnHeaders: {
            color: "white", // Sütun başlıklarını beyaz yapar
            backgroundColor: "#333", // Sütun başlıklarının arka plan rengini koyu yapar
          },
        },
      },
    },
  });

  const columns = [
    { field: "order_no", headerName: "Sipariş No", width: 120 },
    { field: "material_no", headerName: "Malzeme No", width: 120 },
    { field: "operator", headerName: "Operator", width: 150 },
    { field: "area_name", headerName: "Bölüm", width: 150 },
    { field: "entry_measurement", headerName: "Giriş Ölçüsü", width: 110 },
    { field: "exit_measurement", headerName: "Çıkış Ölçüsü", width: 110 },
    {
      field: "entry_weight_50cm",
      headerName: "50cm İçin Giriş Gramajı",
      width: 130,
    },
    {
      field: "exit_weight_50cm",
      headerName: "50cm İçin Çıkış Gramajı",
      width: 130,
    },
    { field: "data_entry_date", headerName: "Veri Giriş Tarihi", width: 180 },
    { field: "description", headerName: "Açıklama", width: 180 },
    {
      field: "measurement_package",
      headerName: "measurement_package",
      width: 120,
    },
  ];

  const rows = allMeasurement?.map((item, index) => {
    const data_entry_date = item.data_entry_date
      ? new Date(item.data_entry_date)
      : null;
    return {
      id: item.id,
      order_no: item.order_no,
      material_no: item.material_no,
      operator: item.operator,
      area_name: item.area_name,
      entry_measurement: item.entry_measurement,
      exit_measurement: item.exit_measurement,
      entry_weight_50cm: item.entry_weight_50cm,
      exit_weight_50cm: item.exit_weight_50cm,
      data_entry_date: data_entry_date
        ? data_entry_date.toLocaleDateString("tr-TR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        : "",
      description: item.description,
      measurement_package: item.measurement_package,
    };
  });

  const inputFields = [
    {
      name: "orderId",
      placeholder: "Sipariş Barkodunu Okutunuz",
      type: "text",
      value: formState.orderId || "", // Eğer undefined ise "" kullan
      onkeydown: handleKeyDown,
      className: `h-[4rem]`,
    },
    {
      name: "entryMeasurement",
      placeholder: "Giriş Ölçüsünü (En x Boy)",
      type: "text",
      value: formState.entryMeasurement || "",
      className: `h-[4rem]`,
    },
    {
      name: "exitMeasurement",
      placeholder: "Çıkış Ölçüsünü (En x Boy)",
      type: "text",
      value: formState.exitMeasurement || "",
      className: `h-[4rem]`,
    },
    {
      name: "entryGramage",
      placeholder: "50 cm İçin Giriş Gramajı",
      type: "number",
      value: formState.entryGramage || "",
      className: `h-[4rem]`,
    },
    {
      name: "exitGramage",
      placeholder: "50 cm İçin Çıkış Gramajı",
      type: "number",
      value: formState.exitGramage || "",
      className: `
        h-[4rem] 
        ${
          measure50Cm &&
          (formState.exitGramage < measure50Cm.lowerLimit ||
            formState.exitGramage > measure50Cm.upperLimit)
            ? "bg-red-500"
            : "bg-white"
        }
      `,
    },
    {
      name: "gramage",
      placeholder: "Gramaj",
      type: "number",
      value: formState.gramage || "",
      className: `h-[4rem]`,
    },
    {
      name: "quantity",
      placeholder: "Adet",
      type: "number",
      value: formState.quantity || "",
      className: `h-[4rem]`,
    },
  ];

  const buttons = [
    {
      children: "Kaydet",
      type: "submit",
      className: "w-[150px] sm:py-2 text-sm",
      onClick: handleSumbit,
    },
    {
      children: "Sil",
      type: "delete",
      className: "w-[150px] sm:py-2 text-sm bg-red-500 hover:bg-red-600",
      onClick: handleDeletedMeasure,
    },
    {
      children: "Kapat",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm bg-red-500 hover:bg-red-600",
      onClick: handleClosePopup,
    },
  ];

  const getRowClassName = (params) => {
    const { row } = params;
    // Seçili satırların stilini belirle
    if (selectedRow?.some((item) => item.id === row.id)) {
      return "selected-row";
    }
    return "default-row"; // Seçili olmayan satırlar için yeni sınıf
  };

  return (
    <div
      className={`w-screen h-screen top-0 left-0 absolute z-50 text-black font-semibold bg-black bg-opacity-75 ${
        theme === "dark" ? "dark-mode" : "light-mode"
      }`}
    >
      <div className="flex items-center justify-center w-full h-full">
        <div
          className={`md:w-[1600px] w-[800px] h-[850px]   popup-content  p-6 rounded-xl shadow-2xl relative `}
        >
          {/* Header */}
          <header className="popup-header">
            <div className="w-full h-full flex items-center justify-between px-6">
              <div className="w-1/4 flex gap-x-10 text-[30px] justify-center items-center">
                <h1 className="text-[28px] text-white uppercase tracking-wide font-bold">
                  Ölçüm Veri Girişi
                </h1>
              </div>
              <div className="w-1/2 flex gap-x-10 text-[25px] justify-center items-center">
                <span className="text-red-600 text-[30px] font-semibold">
                  {isOutOfRange ? "Ölçüm verisi aralık dışında" : ""}
                </span>
              </div>
              <div className="w-1/4 flex gap-x-10 text-[20px] text-white justify-center items-center">
                {measure50Cm && (
                  <span>Alt Limit: {`${measure50Cm?.lowerLimit} gr`}</span>
                )}
                {measure50Cm && (
                  <span>Üst Limit: {`${measure50Cm?.upperLimit} gr`}</span>
                )}
              </div>
            </div>
          </header>

          {/* Data Table */}
          <section className="h-[60%] w-full popup-table p-4">
            <ThemeProvider theme={themes}>
              <div style={{ height: "100%", width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  rowHeight={70}
                  disableRowSelectionOnClick
                  getRowClassName={getRowClassName}
                  onRowClick={(params) => handleRowSelection(params)}
                  sx={{
                    "& .MuiDataGrid-row": {
                      color: "white",
                    },
                    "& .MuiDataGrid-cell": {
                      borderColor: "#fff",
                    },
                  }}
                />
              </div>
            </ThemeProvider>
          </section>

          {/* Footer */}
          <footer className="h-[30%] w-full px-6 py-4">
            {/* Input Fields */}
            <div className="h-[70%] grid grid-cols-6 gap-4">
              {inputFields.map((field, index) => (
                <input
                  key={index}
                  type={field.type}
                  name={field.name}
                  placeholder={field.placeholder}
                  className="p-3 popup-input text-white rounded-lg focus:ring-2 focus:ring-yellow-400 transition-all duration-300"
                  value={field.value}
                  onChange={handleChange}
                  onKeyDown={field.onkeydown}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="h-[30%] flex items-center justify-center gap-x-6 mt-4">
              {buttons.map((button, index) => (
                <button
                  key={index}
                  onClick={button.onClick}
                  type={button.type}
                  className={`popup-button  rounded-lg text-white font-semibold transition-all duration-300 ${
                    button.type === "submit"
                      ? "primary shadow-md"
                      : button.type === "delete"
                      ? "danger shadow-md"
                      : "bg-gray-600 hover:bg-gray-700"
                  }`}
                >
                  {button.children}
                </button>
              ))}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default MeasurementDataEntry;
