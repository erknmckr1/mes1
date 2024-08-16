import React from "react";
import { setMeasurementPopup } from "@/redux/orderSlice";
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

function MeasurementDataEntry() {
  const [formState, setFormState] = useState({
    orderId: "",
    entryMeasurement: "",
    exitMeasurement: "",
    entryGramage: 0.0,
    exitGramage: 0.0,
    gramage: 0.0,
    quantity: 0.0,
  });
  const [orderData, setOrderData] = useState(null);
  const [allMeasurement,setAllMeasurement] = useState([]);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const {userInfo} = useSelector(state => state.user)
  const handleClosePopup = () => {
    dispatch(setMeasurementPopup(false));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  //! Ilgılı bolumdeki olcumlerı cekecek query...
  const getAllMeasurement = async () => {
    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getMeasurements`,{
            params:{
                areaName
            }
        });

        if(response.status === 200){
            setAllMeasurement(response.data);
        }

    } catch (err) {
        console.log(err);
    }
  };

  useEffect(()=>{
    getAllMeasurement();
  },[])

  console.log(allMeasurement)
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

      if (response.status === 200) {
        toast.success("Sipariş başarıyla okutuldu...");
        setOrderData(response.data);
      }
    } catch (err) {
      console.log(err);
    }
  };
  //! Verı kaydı isteği...
  const handleSumbit = async () => {
    const measurementsInfo = {
          order_no: orderData?.ORDER_ID,
          material_no: orderData?.MATERIAL_NO,
          operator: userInfo?.id_dec,
          area_name: areaName,
          entry_measurement: formState.entryMeasurement,
          exit_measurement: formState.exitMeasurement,
          entry_weight_50cm: formState.entryGramage,
          exit_weight_50cm: formState.exitGramage,
          data_entry_date:"" ,
          description: orderData?.ITEM_DESCRIPTION,
          measurement_package: formState.quantity,
    }
    try {
        let response;
        if(measurementsInfo.entry_measurement && measurementsInfo.entry_weight_50cm){
             response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/measurements`,
                measurementsInfo
              );
        }else{
            toast.error("İlgili yerleri doldurum sonra kaydet butonuna basın.")
        }
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
      }
      
    } catch (err) {
      console.log(err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleGetOrderById();
    }
  };

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
    { field: "order_no", headerName: "Sipariş No", width: 150 },
    { field: "material_no", headerName: "Malzeme No", width: 150 },
    { field: "operator", headerName: "Operator", width: 150 },
    { field: "area_name", headerName: "Bölüm", width: 150 },
    { field: "entry_measurement", headerName: "Giriş Ölçüsü", width: 130 },
    { field: "exit_measurement", headerName: "Çıkış Ölçüsü", width: 130 },
    {
      field: "entry_weight_50cm",
      headerName: "50cm İçin Giriş Gramajı",
      width: 180,
    },
    {
      field: "exit_weight_50cm",
      headerName: "50cm İçin Çıkış Gramajı",
      width: 180,
    },
    { field: "data_entry_date", headerName: "Veri Giriş Tarihi", width: 180 },
    { field: "description", headerName: "Açıklama", width: 200 },
    {
      field: "measurement_package",
      headerName: "measurement_package",
      width: 180,
    },
  ];

  const rows = allMeasurement?.map((item,index)=>{
    const data_entry_date = item.data_entry_date
        ? new Date(item.data_entry_date)
        : null;
    return  {
        id: item.id,
        order_no: item.order_no,
        material_no: item.material_no,
        operator: item.operator,
        area_name: item.area_name,
        entry_measurement: item.entry_measurement,
        exit_measurement: item.exit_measurement,
        entry_weight_50cm: item.entry_weight_50cm,
        exit_weight_50cm: item.exit_weight_50cm,
        data_entry_date: data_entry_date,
        description: item.description,
        measurement_package: item.measurement_package,
      }
  })

  const inputFields = [
    {
      name: "orderId",
      placeholder: "Sipariş Barkodunu Okutunuz",
      type: "text",
      value: formState.orderId,
      onkeydown: handleKeyDown,
    },
    {
      name: "entryMeasurement",
      placeholder: "Giriş Ölçüsünü Giriniz",
      type: "number",
      value: formState.entryMeasurement,
    },
    {
      name: "exitMeasurement",
      placeholder: "Çıkış Ölçüsünü Giriniz",
      type: "number",
      value: formState.exitMeasurement,
    },
    {
      name: "entryGramage",
      placeholder: "50 cm İçin Giriş Gramajı",
      type: "number",
      value: formState.entryGramage,
    },
    {
      name: "exitGramage",
      placeholder: "50 cm İçin Çıkış Gramajı",
      type: "number",
      value: formState.exitGramage,
    },
    {
      name: "gramage",
      placeholder: "Gramaj",
      type: "number",
      value: formState.gramage,
    },
    {
      name: "quantity",
      placeholder: "Adet",
      type: "number",
      value: formState.quantity,
    },
  ];
  const buttons = [
    {
      children: "Kaydet",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
      onClick:handleSumbit
    },
    {
      children: "Güncelle",
      type: "button",
      className: "w-[150px] bg-red-500 hover:bg-red-600 sm:py-2 text-sm",
    },
    {
      children: "Temizle",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
    },
    {
      children: "Kapat",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
      onClick: handleClosePopup,
    },
  ];
  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1600px] w-[800px] h-[850px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* header */}
          <header className="h-[10%] w-full bg-secondary">
            <div className="w-full h-full flex items-center justify-center">
              <h1 className="text-[40px] font-semibold">Ölçüm Veri Girişi</h1>
            </div>
          </header>
          <section className="h-[60%] w-full">
            <ThemeProvider theme={theme}>
              <div style={{ height: "100%", width: "100%" }}>
                <DataGrid
                  rows={rows}
                  columns={columns}
                  pageSize={5}
                  checkboxSelection={false}
                  disableRowSelectionOnClick // Seçimi devre dışı bırakır
                  sx={{
                    "& .MuiDataGrid-row": {
                      color: "white", // Satır metinlerini beyaz yapar
                    },
                    "& .MuiDataGrid-cell": {
                      borderColor: "#444", // Hücre sınır rengini koyu yapar
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
                    addProps={"h-[4rem]"}
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

export default MeasurementDataEntry;
