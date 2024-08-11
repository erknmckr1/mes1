import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { toast } from "react-toastify";
import axios from "axios";
import { MdCancel } from "react-icons/md";
import { usePathname } from "next/navigation";
import { setOrderGroupManagement } from "@/redux/orderSlice";

function OrderGroupManagement() {
  const [orderId, setOrderId] = useState("");
  const [orderList, setOrderList] = useState([]);
  const { selectedProcess, selectedMachine } = useSelector(
    (state) => state.order
  );
  const [operatorId, setOperatorId] = useState("222222222");
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const section = pathName.split("/")[2];
  const dispatch = useDispatch();
  const [groupList, setGroupList] = useState([]);
  // orderları gruba gore fıltreleyıp bunu verılerı tuttugumuz state icinde oreder ıd ler var...
  const [filteredGroup, setFilteredGroup] = useState([]);
  const [selectedGroupNo, setSelectedGroupNo] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState([]);

  //! id ye gore siparişi getırecek servıse ıstek atacak fonsıyon...
  const handleGetOrder = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getOrderById`,
        {
          params: {
            orderId, // query params
          },
        }
      );

      if (response.status === 200) {
        // orderList içinde aynı ORDER_ID'ye sahip bir öğe olup olmadığını kontrol et
        const isOrderAlreadyInList = orderList.some(
          (order) => order.ORDER_ID === response.data.ORDER_ID
        );

        if (!isOrderAlreadyInList) {
          setOrderList([...orderList, response.data]);
          toast.success(`${orderId} nolu sipariş başarıyla listeye eklendi`);
        } else {
          toast.error("Bu sipariş zaten listede mevcut.");
        }
      } else if (response.status === 404) {
        toast.error(`${orderId} nolu sipariş bulunamadı.`);
      }
    } catch (err) {
      console.log(err);
      toast.error("Sipariş çekilirken bir hata oluştu.");
    }
  };

  //! Grup listelerini çekecek fonksıyon...
  const handleGetGroupList = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getGroupList`
      );
      setGroupList(response.data);
    } catch (err) {
      console.log(err);
      toast.error("Grup listelerini çekerken hata olustu.");
    }
  };

  useEffect(() => {
    handleGetGroupList();
  }, []);

  console.log(selectedGroupNo);
  console.log(selectedOrderId);

  const handleChangeOrder = (e) => {
    setOrderId(e.target.value);
  };

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleGetOrder();
    }
  }

  const handleClosePopup = () => {
    dispatch(setOrderGroupManagement(false));
  };

  const handleOrderFilteredByGroup = (group_no) => {
    let updatedSelectedGroupNo = [];
    if (selectedGroupNo.includes(group_no)) {
      // Grup zaten seçiliyse, kaldır
      updatedSelectedGroupNo = selectedGroupNo.filter((no) => no !== group_no);
    } else {
      // Grup seçili değilse, ekle
      updatedSelectedGroupNo = [...selectedGroupNo, group_no];
    }
    // Seçili gruplara ait order_id'leri yeniden hesapla
    let newFilteredGroup = [];
    updatedSelectedGroupNo.forEach((no) => {
      const group = groupList.find((g) => g.group_no === no);
      if (group) {
        const orderNumbersArray = group.starting_order_numbers.split(",");
        newFilteredGroup = [...newFilteredGroup, ...orderNumbersArray];
      }
    });

    setSelectedGroupNo(updatedSelectedGroupNo);
    setFilteredGroup(newFilteredGroup);
  };

  //! Grub olusturacak query...
  const handleCreateOrderGroup = async () => {
    try {
      const orderListString = JSON.stringify(orderList); // orderList dizisini JSON string'e çeviriyoruz

      let response;

      if (
        operatorId &&
        selectedMachine &&
        selectedProcess &&
        orderListString.length > 0
      ) {
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/createOrderGroup`,
          {
            orderList: orderListString,
            selectedMachine,
            selectedProcess,
            operatorId,
            section,
            areaName,
          }
        );
      }
      if (response && response.status === 200) {
        toast.success("Sipariş grubu başarıyla oluşturuldu.");
        handleGetGroupList();
      } else {
        toast.error("Sipariş grubu oluşturulamadı.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Sipariş grubu oluşturulamadı.");
    }
  };

  //! Seçili grupları bırlestırecek queryy grupları sıl sıparıslerı yenı grupta topla
  const handleMergeGroups = async () => {
    const groupIds = JSON.stringify(selectedGroupNo);
    try {
      if (groupIds) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/mergeGroups`,
          {
            groupIds,
            operatorId,
            section,
            areaName,
          }
        );

        if (response.status === 200) {
          toast.success("Grup birleştirme işlemi başarılı...");
          handleGetGroupList();
          setSelectedGroupNo([]);
          setSelectedOrderId([]);
        }
      } else {
        toast.error("Birleştirmek istediğiniz grup ID lerını seçiniz...");
      }
    } catch (err) {
      console.log(err);
      toast.error("Gruplar birleştirilemedi...");
    }
  };

  // birden fazla uniq id secıp dızıde tutacak fonksıyon. Sec Bırak...
  const handleSelectOrderId = (order_id) => {
    if (selectedOrderId?.includes(order_id)) {
      const filteredOrderIds = selectedOrderId.filter(
        (item) => order_id !== item
      );
      setSelectedOrderId(filteredOrderIds);
    } else {
      setSelectedOrderId([...selectedOrderId, order_id]);
    }
  };

  const handleRemoveOrderFromList = (item, index) => {
    // orderList'ten seçilen öğeyi kaldırmak için yeni bir dizi oluşturuyoruz
    const updatedOrderList = orderList.filter((_, i) => i !== index);

    // orderList'i güncelliyoruz
    setOrderList(updatedOrderList);

    // Kullanıcıya bilgilendirme mesajı gösteriyoruz
    toast.success(`${item.ORDER_ID} nolu sipariş listeden çıkarıldı.`);
  };

  //! Seçili order ı gruptan cıkarak query gruptan cıkar ve worklog tablosundan ılgılı order ı sıl (status 0 ise);
  const handleRemoveOrderFromGroup = async () => {
    const orderIds = JSON.stringify(selectedOrderId);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/removeOrdersFromGroup`,{
          orderIds,
        }
      );

      if(response.status === 200){
        toast.success("Gruptan siparişleri silme işlemi başarıyla gerçekleştirildi.");
        handleGetGroupList();
        setSelectedOrderId([]);
      }
    } catch (err) {
      console.log(err);
      toast.error("Siparişler gruptan cıkarılamadı.");
    }
  };

  const buttons = [
    {
      children: "Gruba Ekle",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
    },
    {
      children: "Gruptan Çıkar",
      type: "button",
      className: "w-[150px] bg-red-500 hover:bg-red-600 sm:py-2 text-sm",
      onClick:handleRemoveOrderFromGroup
    },
    {
      children: "Grubu Kaldır",
      type: "button",
      className: "w-[150px] bg-red-500 hover:bg-red-600 sm:py-2 text-sm",
    },
    {
      children: "Siparişi Teslim Et",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
    },
  ];
  return (
    <div className="w-screen h-screen top-0 left-0 absolute  text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full">
        <div className="md:w-[1200px] w-[800px] h-[600px] bg-black border-2 border-white p-4 static z-50 rounded-md">
          <div className="h-full w-full p-5 bg-gray-100">
            <div className="flex h-full w-full">
              {/* 1/3 1 */}
              <div className="w-1/3 h-full ">
                <div className="h-[20%] w-full flex items-center justify-center border-b">
                  <div className="">
                    <Input
                      addProps="text-center text-black h-14 border-black border"
                      placeholder="Sipariş No"
                      onChange={handleChangeOrder}
                      value={orderId}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
                <div className="h-[80%] w-full">
                  <div className="w-full h-2/3 ">
                    <div className="flex flex-col">
                      <span className="h-[10%] border-b text-sm text-center py-1 ">
                        Okutulan Siparişler
                      </span>
                    </div>
                    <div className="h-[90%] w-full overflow-y-auto">
                      {orderList.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between py-3 px-2 shadow-md border-b items-center "
                        >
                          <span>
                            {index + 1}. {item.ORDER_ID}
                          </span>
                          <span
                            onClick={() =>
                              handleRemoveOrderFromList(item, index)
                            }
                          >
                            <MdCancel className="text-[25px] cursor-pointer " />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-full h-1/3 flex items-center justify-center">
                    <Button
                      children={"Grup Oluştur"}
                      type={"button"}
                      className={"w-[150px] sm:py-2 text-sm gap-2"}
                      onClick={handleCreateOrderGroup}
                    />
                    <span className={"w-[150px] sm:py-2 text-sm gap-2"}></span>
                  </div>
                </div>
              </div>
              {/* 1/3 2 */}
              <div className="w-1/3 h-full border">
                <div className="h-[20%] w-full flex items-center justify-center border-b">
                  <span className="text-[30px] font-semibold">
                    Grup Yönetimi
                  </span>
                </div>
                <div className="h-[80%] w-full">
                  <div className="w-full h-2/3">
                    <div className="flex flex-col h-full">
                      <span className="h-[10%] border-b text-center text-sm py-1">
                        Grup Listesi
                      </span>
                      <div className=" h-[90%] w-full ">
                        <ul className="w-full h-full overflow-y-auto">
                          {groupList?.map((item, index) => (
                            <ol
                              onClick={() =>
                                handleOrderFilteredByGroup(item.group_no)
                              }
                              className={`w-full py-3 px-2 shadow-md border-b cursor-pointer hover:bg-slate-200 ${
                                selectedGroupNo.includes(item.group_no)
                                  ? "bg-slate-300"
                                  : ""
                              }`}
                              key={index}
                            >
                              {item.group_no}
                            </ol>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1/3 grid grid-cols-2 place-items-center place-content-center">
                    <Button
                      children={"Grubu Kapat"}
                      className={
                        "w-[150px] sm:py-2 text-sm bg-red-500 hover:bg-red-600"
                      }
                    />
                    <Button
                      children={"Grubu Birleştir"}
                      className={"w-[150px] sm:py-2 text-sm"}
                      onClick={handleMergeGroups}
                    />
                  </div>
                </div>
              </div>
              {/* 1/3 3 */}
              <div className="w-1/3 h-full flex flex-col justify-center items-center">
                <div className="h-[20%] w-full border-b">
                  <div className=" h-full w-full flex items-center justify-center ">
                    <Button
                      children={"Kapat"}
                      className="bg-red-500 hover:bg-red-600"
                      onClick={handleClosePopup}
                    />
                  </div>
                </div>
                <div className="h-[80%] w-full">
                  <div className="w-full h-2/3">
                    <div className="flex flex-col h-full">
                      <span className="h-[10%] border-b text-sm text-center py-1">
                        Sipariş Listesi
                      </span>
                      <div className="h-[90%] w-full  ">
                        <ul className="w-full h-full overflow-y-auto">
                          {filteredGroup?.map((item, index) => (
                            <ol
                              className={`w-full py-3 px-2 shadow-md border-b cursor-pointer hover:bg-slate-300 ${
                                selectedOrderId.includes(item)
                                  ? "bg-slate-200"
                                  : ""
                              }`}
                              key={index}
                              onClick={() => handleSelectOrderId(item)}
                            >
                              {item}
                            </ol>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-1/3 flex justify-center">
                    <div className="w-full h-auto grid grid-cols-2 place-items-center">
                      {buttons.map((button, index) => (
                        <Button
                          key={index}
                          children={button.children}
                          className={button.className}
                          type={button.type}
                          onClick={button.onClick}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-75 top-0 left-0"></div>
    </div>
  );
}

export default OrderGroupManagement;
