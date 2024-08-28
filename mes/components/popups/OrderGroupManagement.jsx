import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { toast } from "react-toastify";
import axios from "axios";
import { MdCancel } from "react-icons/md";
import { usePathname } from "next/navigation";
import { setOrderGroupManagement, fetchBuzlamaWorks } from "@/redux/orderSlice";
import { getWorkList } from "@/api/client/cOrderOperations";
import GroupNos from "./GroupNos";
import {
  setGroupListPopup,
  setGetGroupList,
  setSelectedGroupNos,
  setSelectedOrderIds,
  setFilteredGroup,
} from "@/redux/orderSlice";

function OrderGroupManagement() {
  const [orderId, setOrderId] = useState("");
  const [orderList, setOrderList] = useState([]);
  const {
    groupListPopup,
    groupList,
    filteredGroup,
    selectedGroupNo,
    selectedOrderId,
    buzlamaWork,
  } = useSelector((state) => state.order);
  const { userInfo } = useSelector((state) => state.user);
  const [operatorId, setOperatorId] = useState("222222222");
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const section = pathName.split("/")[2];
  const dispatch = useDispatch();

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
        setOrderId("");
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
      dispatch(setGetGroupList(response.data));
    } catch (err) {
      console.log(err);
      if (err.response.status === 404) {
        dispatch(setGetGroupList([]));
      }
    }
  };

  //! ilgili bolumdeki siparişleri çek
  useEffect(() => {
    dispatch(fetchBuzlamaWorks({ areaName }));
  }, [dispatch, areaName]);

  useEffect(() => {
    handleGetGroupList();
  }, []);


  console.log({
    orderIds: selectedOrderId,
    groupNos: selectedGroupNo,
    filteredGroup: filteredGroup,
    gruplist: groupList,
  });


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
    setOrderId("");
    dispatch(setSelectedOrderIds([]));
    dispatch(setSelectedGroupNos([]));
  };

  // grupları sec dızıde topla sonrasında orderları gruplara göre filtrele...
const handleOrderFilteredByGroup = (group_record_id) => {
  let updatedSelectedGroupRecordIds = [];
  
  if (selectedGroupNo?.includes(group_record_id)) {
    // Grup zaten seçiliyse, kaldır
    updatedSelectedGroupRecordIds = selectedGroupNo.filter(
      (id) => id !== group_record_id
    );
  } else {
    // Grup seçili değilse, ekle
    updatedSelectedGroupRecordIds = [
      ...selectedGroupNo,
      group_record_id
    ];
  }

  // Seçili gruplara ait order_id'leri ve uniq_id'leri yeniden hesapla
  let newFilteredGroup = [];

  updatedSelectedGroupRecordIds.forEach((id) => {
    const ordersForGroup = buzlamaWork.filter(
      (order) => order.group_record_id === id
    );
    newFilteredGroup = [
      ...newFilteredGroup,
      ...ordersForGroup.map((order) => ({
        order_no: order.order_no,
        uniq_id: order.uniq_id,
      })),
    ];
  });

  // newFilteredGroup şimdi hem order_no hem de uniq_id içerecek
  console.log(newFilteredGroup);
  dispatch(setSelectedGroupNos(updatedSelectedGroupRecordIds));
  dispatch(setFilteredGroup(newFilteredGroup));
};

  //! Grub olusturacak query...
  const handleCreateOrderGroup = async () => {
    try {
      const orderListString = JSON.stringify(orderList); // orderList dizisini JSON string'e çeviriyoruz

      let response;

      if (operatorId && orderList.length > 0) {
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/createOrderGroup`,
          {
            orderList: orderListString,
            operatorId,
            section,
            areaName,
          }
        );
      }
      if (response && response.status === 200) {
        toast.success("Sipariş grubu başarıyla oluşturuldu.");
        handleGetGroupList();
        dispatch(fetchBuzlamaWorks({ areaName }));
        setOrderId("");
        setOrderList([]);
        dispatch(setSelectedOrderIds([]));
        dispatch(setSelectedGroupNos([]));
      } else {
        toast.error("Sipariş grubu oluşturulamadı.");
      }
    } catch (err) {
      console.log(err);
      if (err.request.status === 400) {
        // Server bir yanıt döndürdüyse
        toast.error(err.response.data || "Sipariş grubu oluşturulamadı.");
        setOrderId("");
        setOrderList([]);
      } else {
        // İstek hazırlanırken bir hata oluştu
        toast.error("İstek hazırlanırken bir hata oluştu.");
      }
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
            operatorId, // şimdilik giriş yapan kullanıcının id sini almıyoruz.
            section,
            areaName,
          }
        );

        if (response.status === 200) {
          toast.success("Grup birleştirme işlemi başarılı...");
          handleGetGroupList();
          dispatch(fetchBuzlamaWorks({ areaName }));
          dispatch(setSelectedGroupNos([]));
          dispatch(setSelectedOrderIds([]));
          dispatch(setFilteredGroup([]));
        }
      } else {
        toast.error("Birleştirmek istediğiniz grup ID lerını seçiniz...");
      }
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) {
        toast.error(err.response.data);
      }else if(err.response.status === 500){
        toast.error(err.response.data);
      }
    }
  };

  // birden fazla uniq id secıp dızıde tutacak fonksıyon. Sec Bırak... order no ya gore ıslem yapmıyoruz. 
  const handleSelectOrderId = (selectedOrder) => {
    let updatedSelectedOrderIds;

    if (
      selectedOrderId?.some((order) => order.uniq_id === selectedOrder.uniq_id)
    ) {
      updatedSelectedOrderIds = selectedOrderId.filter(
        (order) => order.uniq_id !== selectedOrder.uniq_id
      );
    } else {
      updatedSelectedOrderIds = [...selectedOrderId, selectedOrder];
    }
    dispatch(setSelectedOrderIds(updatedSelectedOrderIds));
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
    //her satırın bır unıq ıd sı var onu yolluyoruz...
    const orderUniqIds = JSON.stringify(
      selectedOrderId
    );
    const groupNo = JSON.stringify(
      selectedGroupNo
    )
    try {
      if (selectedOrderId.length > 0 && selectedGroupNo.length < 2) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/removeOrdersFromGroup`,
          {
            orderUniqIds,
            groupNo,
            operatorId
          }
        );

        if (response.status === 200) {
          if (response.data.includes("Grup kapatıldı")) {
            toast.success(response.data);
            dispatch(setFilteredGroup([]));
            handleGetGroupList(); // grup listesini guncellemek ıcın tekrardan servise istek attık
            dispatch(setSelectedGroupNos()); // seçili grubu bırak cunku grup db sılındı yada kapatıldı... 
          } else {
            toast.success(response.data);
            const updatedOrderList = filteredGroup.filter(
              (order) => !selectedOrderId.some(
                (selected) => selected.uniq_id === order.uniq_id
              )
            );
            dispatch(setFilteredGroup(updatedOrderList));
            dispatch(setSelectedOrderIds([]));
          }
        } else {
          toast.error(response.data);
        }

      } else {
        toast.error(
          "Gruptan Çıkarmak istediğiniz siparişi seçiniz. Yada sadece 1 grup üzerinden işlem yapın."
        );
      }
    } catch (err) {
      console.log(err);
    }
  };

  //! Gruptaki işler baslamadıysa grubu kapatacak istek...
  const handleCloseGroup = async () => {
    const groupNos = JSON.stringify(selectedGroupNo);
    try {
      let response;
      if (selectedGroupNo && selectedGroupNo.length < 2) {
        response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/closeSelectedGroup`,
          {
            groupNos,
          }
        );
      } else {
        toast.error(
          "Kapatacağınız grubu seçiniz. (Tek seferde sadece bir grubu kapatabilirsiniz.)"
        );
      }

      if (response.status === 200) {
        toast.success(response.data);
        handleGetGroupList();
        dispatch(setSelectedOrderIds([]));
        dispatch(setSelectedGroupNos([]));
        dispatch(setFilteredGroup([]));
        setOrderList([]);
      }
    } catch (err) {
      console.log(err);
      if (err.response.status === 400) {
        toast.error(err.response.data);
      }
    }
  };

  //! Siparişi teslim edecek istek...
  const deliverSelectedOrder = async () => {
    const order = selectedOrderId[0];
    const group_no = selectedGroupNo[0];
    const { id_dec, op_username } = userInfo;
    try {
      if (selectedOrderId.length === 1 && selectedGroupNo.length === 1) {
        const response = await axios.put(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/deliverSelectedOrder`,
          {
            order,
            id_dec,
            op_username,
            group_no,
          }
        );
        if (response.status === 200) {
          console.log(response.data);
          toast.success("Sipariş başarıyla bitirildi.");
          handleGetGroupList();
          getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
          dispatch(fetchBuzlamaWorks({ areaName }));
          const updatedOrderList = filteredGroup.filter(
            (order) =>
              !selectedOrderId.some(
                (selected) => selected.uniq_id === order.uniq_id
              )
          );
          dispatch(setFilteredGroup(updatedOrderList));
          dispatch(setSelectedOrderIds([]));
          dispatch(setSelectedGroupNos([]));
        }
      } else {
        toast.error("Sedece bir grup ve bir sipariş seçin.");
      }
    } catch (err) {
      console.log(err);
      if(err.response.status === 400){
        toast.error(err.response.data);
      }else if (err.response.status === 500){
        toast.error(err.response.data);
      }
    }
  };

  // gruba ekleme popup ını acacak fonksıyon
  const handleOpenGroupNos = () => {
    if (selectedOrderId.length > 0 && selectedGroupNo.length === 1) {
      dispatch(setGroupListPopup(true));
    } else {
      toast.error(
        "Farklı gruba atayacağınız siparişleri seçiniz. Yada sadece bir grubu işaretleyin"
      );
    }
  };

  const buttons = [
    {
      children: "Gruba Ekle",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
      onClick: handleOpenGroupNos,
    },
    {
      children: "Gruptan Çıkar",
      type: "button",
      className: "w-[150px] bg-red-500 hover:bg-red-600 sm:py-2 text-sm",
      onClick: handleRemoveOrderFromGroup,
    },
    {
      children: "Siparişi Teslim Et",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
      onClick: deliverSelectedOrder,
    },
  ];
  return (
    <div className="w-screen h-screen top-0 left-0 absolute  text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full">
        <div className="md:w-[1200px] w-[800px] h-[600px] bg-black border-2 border-white p-4 static z-50 rounded-md">
          <div className="w-full h-full relative">
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
                      <span
                        className={"w-[150px] sm:py-2 text-sm gap-2"}
                      ></span>
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
                                  handleOrderFilteredByGroup(item.group_record_id)
                                }
                                className={`w-full py-3 px-2 shadow-md border-b cursor-pointer hover:bg-slate-200 ${
                                  selectedGroupNo?.includes(item.group_record_id)
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
                        onClick={handleCloseGroup}
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
                                  selectedOrderId.some(
                                    (order) => order.uniq_id === item.uniq_id
                                  )
                                    ? "bg-slate-300"
                                    : ""
                                }`}
                                key={index}
                                onClick={() => handleSelectOrderId(item)}
                              >
                                {item.order_no}
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
            {/* grup listesini gosterecek komponent... */}
            {groupListPopup && (
              <GroupNos fetchBuzlamaWorks={fetchBuzlamaWorks} handleGetGroupList={handleGetGroupList} />
            )}
            {/* grup listesini gosterecek komponent end... */}
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-75 top-0 left-0"></div>
    </div>
  );
}

export default OrderGroupManagement;
