import React from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { setSelectedMachine, setSelectedProcess } from "@/redux/orderSlice";
import { useDispatch } from "react-redux";
import { setPastGroupOperationsPopup } from "@/redux/orderSlice";
import Button from "../ui/Button";
import axios from "axios";
import { toast } from "react-toastify";
import { getWorkList } from "@/api/client/cOrderOperations";
function PastGroupsOperationsPopup() {
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const section = pathName.split("/")[2];
  const { userInfo } = useSelector((state) => state.user);
  const [closedGroupsList, setClosedGroupsList] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);
  const [filteredPastOrders, setFilteredPastOrders] = useState([]);
  const [selectedClosedGroup, setSelectedClosedGroup] = useState({});
  const { processList, machineList, selectedProcess, selectedMachine } =
    useSelector((state) => state.order);
  const [onMachine, setOnMachine] = useState(null);
  const { theme } = useSelector((theme) => theme.global);

  //! Kapalı grupları cekecek fonksıyon...
  const handleGetClosedGroups = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getClosedGroups`
      );
      setClosedGroupsList(response.data);
    } catch (err) {
      console.log(err);
      setClosedGroupsList([]);
    }
  };

  //! Ilgılı bırımın tamamlanmıs yada iptal olan siparişlerini çeken query...
  const handleGetPastOrders = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/getFinishedOrders`,
        {
          params: {
            area_name: areaName,
          },
        }
      );
      setPastOrders(response.data);
    } catch (err) {
      console.log(err);
      setPastOrders([]);
    }
  };

  //! Geçmiş bir grubu ve siparişlerini tekrardan aynı yada farklı proseste baslatacak servis...
  const handleSendMachine = async () => {
    const { id_dec } = userInfo;
    const { group_no, group_record_id } = selectedClosedGroup;
    const { process_name, process_id } = selectedProcess;
    const { machine_name, machine_id } = selectedMachine;
    try {
      let response ;
     if(selectedMachine && selectedProcess && selectedClosedGroup){
       response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/restartGroupProcess`,
        {
          areaName,
          section,
          id_dec,
          process_id,
          machine_name,
          process_name,
          group_no,
          group_record_id,
        }
      );
     }else {
      toast.error("İşi başlatacağınız proses ve makineyi seçiniz.")
     }

      if (response.status === 200) {
        toast.success(response.data);
        getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
        setSelectedProcess("");
        setSelectedMachine("");
        setSelectedClosedGroup({});
      } else {
        toast.error(response.data);
      }
    } catch (err) {
      console.log(err);
      toast.error(err.response.data);
    }
  };

  console.log({
    grup: selectedClosedGroup,
    prosess: selectedProcess,
    machine: selectedMachine,
  });

  // popup ı kapat...
  const handleClosePopup = () => {
    setSelectedClosedGroup({});
    dispatch(setSelectedMachine(""));
    dispatch(setSelectedProcess(""));
    dispatch(setPastGroupOperationsPopup(false));
  };

  useEffect(() => {
    handleGetClosedGroups();
    handleGetPastOrders();
  }, []);

  // makineleri prosese göre filtrele
  const filteredMachine = () => {
    if (!machineList || !selectedProcess) {
      return;
    }
    const filtered = machineList.filter(
      (item) => item.process_name === selectedProcess.process_name
    );
    setOnMachine(filtered);
  };

  // orderları gruba gore fıltrele ve degıskende tut... 
  const filteredOrders = (group) => {
    const filteredOrders = pastOrders.filter(
      (item, i) => item.group_record_id === group.group_record_id
    );
    setFilteredPastOrders(filteredOrders);
  };

  useEffect(() => {
    filteredMachine();
  }, [selectedProcess]);

  // Grubu sececek fonk. sec bılgılerı tut
  const handleSelectedGroup = (item) => {
    setSelectedClosedGroup(item);
    filteredOrders(item);
  };

  const buttons = [
    {
      children: "Makineye Gönder",
      type: "button",
      className: "w-[150px] sm:py-2 text-sm",
      onClick: handleSendMachine,
    },
    {
      children: "Kapat     ",
      type: "button",
      className: "w-[150px] bg-red-500 hover:bg-red-600 sm:py-4 text-sm",
      onClick: handleClosePopup,
    },
  ];
  return (
    <div className="w-screen h-screen top-0 left-0 absolute text-black font-semibold">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="md:w-[1400px] w-[800px] h-[800px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          {/* Header kısmı */}
          <div className="h-[10%] w-full bg-secondary">
            <div className="w-full h-full flex items-center justify-center">
              <span
                className={`px-6 py-3 text-left text-lg ${theme} thead   font-medium uppercase tracking-wider`}
              >
                Bitmiş Gruplar Üzerinde İşlemler
              </span>
            </div>
          </div>
          {/* section */}
          <div className="h-[70%] w-full flex gap-x-2">
            <div className="w-1/3 h-full">
              {/* Closed Group List */}
              <div className="h-full  w-full flex flex-col ">
                {/* title */}
                <div className="h-[10%] text-white w-full text-center">
                  <div
                    className={`px-6 py-3 text-left text-md ${theme} thead   font-medium uppercase tracking-wider`}
                  >
                    Kapanmış Grup Numaraları
                  </div>
                </div>
                {/* group list */}
                <ul className="w-full h-full overflow-y-auto bg-slate-50">
                  {closedGroupsList.length === 0 ? (
                    <div>Kapalı grup bulunamadı.</div>
                  ) : (
                    closedGroupsList.map((item, index) => (
                      <ol
                        key={index}
                        onClick={() => handleSelectedGroup(item)}
                        className={`w-full py-3 px-2 shadow-md border-b bg-slate-100 cursor-pointer hover:bg-slate-200 ${
                          selectedClosedGroup?.group_record_id ===
                          item.group_record_id
                            ? "bg-slate-300"
                            : ""
                        }`}
                      >
                        {item.group_no}
                      </ol>
                    ))
                  )}
                </ul>
              </div>
            </div>
            {/* Order list...  */}
            <div className="w-1/3 h-full">
              <div className="h-full  w-full flex flex-col ">
                {/* title */}
                <div className="h-[10%] text-white w-full text-center">
                  <div
                    className={`px-6 py-3 text-left text-md ${theme} thead   font-medium uppercase tracking-wider`}
                  >
                    Seçili Gruptaki Siparişler
                  </div>
                </div>
                <ul className="w-full h-full overflow-y-auto bg-slate-50">
                  {filteredPastOrders?.map((item, index) => (
                    <ol
                      className={`w-full py-3 px-2 shadow-md border-b bg-slate-100 cursor-pointer`}
                      key={index}
                    >
                      {item.order_no}
                    </ol>
                  ))}
                </ul>
              </div>
            </div>
            {/* Process & Machine */}
            <div className="w-1/3 h-full">
              {/* process */}
              <div className="h-[30%] w-full bg-white flex flex-col justify-between">
                <div
                  className={`px-6 py-3  text-left text-md ${theme} thead   font-medium uppercase tracking-wider`}
                >
                  Proses Listesi
                </div>
                <ul className="overflow-y-auto text-center bg-white border-t-2">
                  {processList &&
                    processList.map((item, index) => (
                      <li
                        onClick={() => dispatch(setSelectedProcess(item))}
                        key={item.process_id}
                        className={`p-2 hover:bg-green-600 border cursor-pointer  ${
                          selectedProcess.process_name === item.process_name
                            ? "bg-green-600 text-white font-semibold transition-all"
                            : `listeleman ${theme}`
                        }`}
                      >
                        {item.process_name}
                      </li>
                    ))}
                </ul>
              </div>
              {/* machine */}
              <div className="w-full h-[70%] bg-slate-50 flex flex-col border-l">
                <div
                  className={`px-6 py-3 text-left text-md ${theme} thead   font-medium uppercase tracking-wider`}
                >
                  Makineler
                </div>
                <ul className="overflow-y-auto text-center bg-white border-t-2">
                  {onMachine &&
                    onMachine.map((item, index) => (
                      <li
                        key={index}
                        className={`p-2 hover:bg-green-600 border cursor-pointer ${
                          selectedMachine.machine_name === item.machine_name
                            ? "bg-green-500"
                            : `listeleman ${theme}`
                        }`}
                        onClick={() => dispatch(setSelectedMachine(item))}
                      >
                        {item.machine_name}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Buttons */}
          <div className="h-[20%] w-full mt-1 flex items-center justify-center border-t ">
            <div className="h-full w-1/2 flex items-center justify-center gap-x-10">
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
         { selectedClosedGroup &&   <div className="w-1/2 h-full text-white">
           {selectedClosedGroup &&  <h1 className="w-full text-center py-2 text-[30px]">{selectedClosedGroup?.group_no} no'lu gurubun önceki işlemi</h1>}
                <div className="grid grid-cols-2 text-white h-full w-full justify-items-center align-items-center  text-[25px] ">
                  <span>Proses İsmi : {selectedClosedGroup?.process_name}</span>
                  <span>Makine İsmi : {selectedClosedGroup?.machine_name}</span>
                </div>
            </div>}
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default PastGroupsOperationsPopup;
