import React from "react";
import { setFirePopup } from "@/redux/globalSlice";
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

function FirePopup() {
  const [formState, setFormState] = useState({
    orderId: "", // String olarak kalıyor
    goldSetting: 0, // Sayısal başlangıç değeri
    entryGramage: 0.0, // Sayısal başlangıç değeri
    exitGramage: 0.0, // Sayısal başlangıç değeri
    gold_pure_scrap: 0.0, // Sayısal başlangıç değeri
    diffirence: 0.0, // Sayısal başlangıç değeri
  });

  const [selectedRow, setSelectedRow] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [allMeasurement, setAllMeasurement] = useState([]);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { userInfo, user } = useSelector((state) => state.user);

  const handleClosePopup = () => {
    dispatch(setFirePopup(null));
    setOrderData(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Eğer sayı beklenen bir alan ise değeri sayıya çeviriyoruz
    const convertedValue =
      name === "diffirence" ||
      name === "goldSetting" ||
      name === "entryGramage" ||
      name === "gold_pure_scrap" ||
      name === "exitGramage"
        ? parseFloat(value) || 0 // Eğer geçerli bir sayı değilse 0 yap
        : value; // Diğer alanlar için olduğu gibi bırak

    // Yeni state'i güncellerken farkı otomatik hesapla
    const newFormState = {
      ...formState,
      [name]: convertedValue,
    };

    // Eğer giriş ya da çıkış ölçüsü değiştiyse farkı hesapla
    if (name === "entryGramage" || name === "exitGramage") {
      const diff = newFormState.entryGramage - newFormState.exitGramage;
      newFormState.diffirence = diff;
    }

    // Has fire değerini hesapla
    if (
      name === "gold_pure_scrap" ||
      name === "entryGramage" ||
      name === "exitGramage"
    ) {
      const caratMultiplier = {
        8: 0.33,
        9: 0.33,
        10: 0.416,
        14: 0.585,
        18: 0.75,
        21: 0.875,
      };

      const multiplier = caratMultiplier[orderData?.CARAT] || 1;
      newFormState.gold_pure_scrap = newFormState.diffirence * multiplier;
    }

    setFormState(newFormState);
  };

  //! Okutulan siparişi çekecek query...
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
        await handleGetScrapMeasure();
        setFormState({
          orderId: response.data.ORDER_ID, // String olarak kalıyor
          goldSetting: response.data.CARAT, // Sayısal başlangıç değeri
          entryGramage: 0.0, // Sayısal başlangıç değeri
          exitGramage: 0.0, // Sayısal başlangıç değeri
          gold_pure_scrap: 0.0, // Sayısal başlangıç değeri
          diffirence: 0.0, // Sayısal başlangıç değeri
        });
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGetOrderById();
    }
  };

  //! Girilen order id ye göre fire ölçümünü çekecek servis...
  const handleGetScrapMeasure = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getScrapMeasure`,
        {
          params: {
            order_no: orderData?.ORDER_ID,
          },
        }
      );

      if (response.status === 200) {
        setAllMeasurement(response.data); // Veriyi state'e setlemeye devam ediyoruz
        return response.data; // Veriyi ayrıca döndürüyoruz ki handleSubmit kullanabilsin
      } else {
        const emptyData = {
          orderId: "", // String olarak kalıyor
          goldSetting: 0, // Sayısal başlangıç değeri
          entryGramage: 0.0, // Sayısal başlangıç değeri
          exitGramage: 0.0, // Sayısal başlangıç değeri
          gold_pure_scrap: 0.0, // Sayısal başlangıç değeri
          diffirence: 0.0, // Sayısal başlangıç değeri
        };
        setAllMeasurement(emptyData);
        return emptyData; // Boş veriyi de döndürüyoruz
      }
    } catch (err) {
      console.log(err);
      return []; // Hata durumunda boş bir array döndürüyoruz
    }
  };

  //! Verileri kaydedecek query...
  const handleSubmit = async () => {
    try {
      if (!orderData || orderData?.length === 0) {
        toast.error("Okutulan sipariş hatalı, sipariş bulunamadı.");
        return;
      } else if (!formState.entryGramage || !formState.exitGramage) {
        toast.error("Giriş ya da Çıkış ölçüsünü girip tekrar deneyiniz.");
        return;
      }

      // Önce mevcut fire ölçümünü alıyoruz
      const previousScrap = await handleGetScrapMeasure();
      console.log(previousScrap);
      // Eğer daha önce bir ölçüm yapılmışsa kullanıcıya bilgi veriyoruz
      if (previousScrap && previousScrap.length > 0) {
        toast.info(
          `${orderData.ORDER_ID} no'lu sipariş için daha önce fire ölçümü yapılmış...`
        );
        return;
      }

      // Eğer ölçüm yoksa kaydı yapıyoruz
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/scrapMeasure`,
        { formState, user_id: userInfo.id_dec, areaName }
      );

      if (response.status === 200) {
        toast.success("Fire veri girişi başarıyla gerçekleştirildi.");
        await handleGetScrapMeasure(); // Yeni ölçümü tekrar çekiyoruz
        setFormState({
          orderId: "", // String olarak kalıyor
          goldSetting: 0, // Sayısal başlangıç değeri
          entryGramage: 0.0, // Sayısal başlangıç değeri
          exitGramage: 0.0, // Sayısal başlangıç değeri
          gold_pure_scrap: 0.0, // Sayısal başlangıç değeri
          diffirence: 0.0, // Sayısal başlangıç değeri
        });
      }
    } catch (err) {
      console.log(err);
      toast.error("Fire veri girişi sırasında bir hata oluştu.");
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
      const { id } = selectedRow[0];
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/deleteScrapMeasure`,
        { id }
      );
      if (response.status === 200) {
        toast.success("Ölçüm basarıyla silindi");
        await handleGetScrapMeasure();
        setFormState({
          orderId: "", // String olarak kalıyor
          goldSetting: 0, // Sayısal başlangıç değeri
          entryGramage: 0.0, // Sayısal başlangıç değeri
          exitGramage: 0.0, // Sayısal başlangıç değeri
          gold_pure_scrap: 0.0, // Sayısal başlangıç değeri
          diffirence: 0.0, // Sayısal başlangıç değeri
        })
      }
    } catch (err) {
      console.log(err);
    }
  };
  console.log(selectedRow);
  const theme = createTheme({
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
    { field: "order_no", headerName: "Sipariş No", width: 200 },
    { field: "operator", headerName: "Operator", width: 200 },
    { field: "area_name", headerName: "Bölüm", width: 200 },
    { field: "entry_measurement", headerName: "Giriş Ölçüsü", width: 200 },
    { field: "exit_measurement", headerName: "Çıkış Ölçüsü", width: 200 },
    { field: "data_entry_date", headerName: "Veri Giriş Tarihi", width: 200 },
    { field: "gold_setting", headerName: "Ayar", width: 200 },
    { field: "has_fire", headerName: "Has Fire", width: 200 },
  ];

  const rows = allMeasurement?.map((item, index) => {
    const data_entry_date = item.createdAt ? new Date(item.createdAt) : null;
    return {
      id: item.scrapMeasurement_id,
      order_no: item.order_no,
      operator: item.operator,
      area_name: item.area_name,
      entry_measurement: item.entry_measurement,
      exit_measurement: item.exit_measurement,
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
      gold_setting: item.gold_setting,
      has_fire: item.gold_pure_scrap,
    };
  });
  console.log(formState);
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
      name: "goldSetting",
      placeholder: "Ayar Giriniz",
      type: "number",
      value: formState.goldSetting || "",
      className: `h-[4rem]`,
    },
    {
      name: "entryGramage",
      placeholder: "Giriş Ölçüsünü Giriniz",
      type: "number",
      value: formState.entryGramage || "",
      className: `h-[4rem]`,
    },
    {
      name: "exitGramage",
      placeholder: "Çıkış Ölçüsünü Giriniz",
      type: "number",
      value: formState.exitGramage || "",
      className: `h-[4rem]`,
    },
    {
      name: "gold_pure_scrap",
      placeholder: "Has Fire",
      type: "number",
      value: formState.gold_pure_scrap || "",
      className: `
            h-[4rem] 
          `,
    },
    {
      name: "diffirence",
      placeholder: "Fark",
      type: "number",
      value: formState.diffirence || "",
      className: `h-[4rem]`,
    },
  ];

  const buttons = [
    {
      children: "Kaydet",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
      onClick: handleSubmit,
    },
    {
      children: "Sil",
      type: "button",
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
    return "";
  };
  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1600px] w-[800px] h-[850px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* header */}
          <header className="h-[10%] w-full bg-secondary">
            <div className="w-full h-full flex items-center justify-between">
              <div className="w-full h-full flex gap-x-10 text-[30px] justify-center items-center">
                <h1 className="text-[35px] text-white underline tracking-wider  font-semibold">
                  Fire Veri Girişi
                </h1>
              </div>
            </div>
          </header>
          <section className="h-[60%] w-full">
            <ThemeProvider theme={theme}>
              <div style={{ height: "100%", width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  rowHeight={50}
                  disableRowSelectionOnClick // Seçimi devre dışı bırakır
                  getRowClassName={getRowClassName}
                  onRowClick={(params) => handleRowSelection(params)}
                  sx={{
                    "& .MuiDataGrid-row": {
                      color: "white", // Satır metinlerini beyaz yapar
                    },
                    "& .MuiDataGrid-cell": {
                      borderColor: "#fff", // Hücre sınır rengini koyu yapar
                    },
                  }}
                />
              </div>
            </ThemeProvider>
          </section>
          <footer className="h-[30%] w-full">
            <div className="h-[70%] w-full">
              {/* inputs */}
              <div className="h-full grid grid-cols-6 gap-4 p-4">
                {inputFields.map((field, index) => (
                  <Input
                    key={index}
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    addProps={field.className}
                    touched={field.name === "entryGramage"} // Example of using touched and errorMessage
                    errorMessage={
                      field.name === "entryGramage" &&
                      formState.entryGramage <= 0
                        ? "Değer sıfırdan büyük olmalı"
                        : ""
                    }
                    value={field.value}
                    onChange={handleChange}
                    onKeyDown={field.onkeydown}
                  />
                ))}
              </div>
            </div>
            {/* buttons */}
            <div className="h-[30%] w-full flex items-center justify-center gap-x-10">
              {buttons.map((button, index) => (
                <Button
                  onClick={button.onClick}
                  type={button.type}
                  className={button.className}
                  children={button.children}
                  key={index}
                />
              ))}
            </div>
          </footer>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default FirePopup;
