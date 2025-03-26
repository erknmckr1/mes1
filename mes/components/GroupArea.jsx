import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  handleGetGroupList,
  fetchBuzlamaWorks,
  setFilteredGroup,
  setSelectedGroupNos,
  setSelectedHammerSectionField,
  getJoinTheField,
  setSelectedPersonInField,
  setSelectedMachine,
  setSelectedProcess,
} from "@/redux/orderSlice";
import { usePathname } from "next/navigation";
function GroupArea() {
  const { theme } = useSelector((theme) => theme.global);
  const dispatch = useDispatch();
  const pathName = usePathname();
  const section = pathName.split("/")[2];
  const areaName = pathName.split("/")[3];
  const [filteredPersonInField, setFilteredPersonInField] = useState([]);

  const {
    groupList,
    selectedGroupNo,
    buzlamaWork,
    filteredGroup,
    selectedHammerSectionField,
    usersJoinedTheField,
    selectedPersonInField,
    workList,
    selectedMachine,
    selectedProcess
  } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(handleGetGroupList());
    dispatch(fetchBuzlamaWorks({ areaName }));
    // şimdilik isteği sadece cekıc ekranlarında atalım
    if (areaName === "cekic" || areaName === "telcekme") {
      dispatch(getJoinTheField({ areaName }));
    }
  }, [dispatch, areaName]);

  // seçilen grubu ılgılı ozellıklerıyle bır dızıde tut ve bu grubua gore orderları fıltrele
  const handleOrderFilteredByGroup = ({
    group_record_id,
    group_status,
    group_no,
  }) => {
    let updatedSelectedGroupNo = [];

    if (
      selectedGroupNo.some((group) => group.group_record_id === group_record_id)
    ) {
      updatedSelectedGroupNo = selectedGroupNo.filter(
        (group) => group.group_record_id !== group_record_id
      );
    } else {
      updatedSelectedGroupNo = [
        // ...selectedGroupNo,
        { group_record_id, group_status, group_no },
      ];
    }

    let newFilteredGroup = [];
    updatedSelectedGroupNo.forEach((group) => {
      const ordersForGroup = buzlamaWork.filter(
        (order) => order.group_record_id === group.group_record_id
      );
      newFilteredGroup = [
        ...newFilteredGroup,
        ...ordersForGroup.map((order) => ({
          order_no: order.order_no,
          uniq_id: order.uniq_id,
        })),
      ];
    });

    dispatch(setSelectedGroupNos(updatedSelectedGroupNo));
    dispatch(setFilteredGroup(newFilteredGroup));
  };
  //? yenı makıne ıslevı gerceklestıgı zaman son prosesi listele...
  const filteredGroupList = groupList.reduce((acc, group) => {
    const existingGroup = acc.find((g) => g.group_no === group.group_no);
    if (
      !existingGroup ||
      new Date(existingGroup.group_creation_date) <
        new Date(group.group_creation_date)
    ) {
      // Eğer bu group_no daha önce eklenmediyse ya da daha yeniyse, güncelle
      return acc.filter((g) => g.group_no !== group.group_no).concat(group);
    }
    return acc;
  }, []);

  const cekicAreas = [
    { field: "Makine", name: "makine", id: 1 },
    { field: "Tezgah", name: "tezgah", id: 2 },
    { field: "Açma", name: "acma", id: 3 },
    { field: "Sarma", name: "sarma", id: 4 },
  ];

  //? BÖLÜME KATILMA İŞLEMLERİ
  // cekic alanı sececek fonksıyon...
  const handleSelectedArea = (name) => {
    dispatch(setSelectedHammerSectionField(name));
    dispatch(setSelectedMachine(""));
    dispatch(setSelectedProcess(""));
  };

  const handleSelectedPersonInField = useCallback(
    (operator_id) => {
      if (selectedPersonInField !== operator_id) {
        dispatch(setSelectedPersonInField(operator_id));
      } else {
        dispatch(setSelectedPersonInField(""));
      }
    },
    [dispatch, selectedPersonInField]
  );

  useEffect(() => {
    let filtered ;
    if(areaName === "telcekme"){
      filtered = usersJoinedTheField.filter((item) => {
        return item.machine_name === selectedMachine?.machine_name;
      });
    }else{
      filtered = usersJoinedTheField.filter((item) => {
        return item.field === selectedHammerSectionField;
      });
    }
    
    setFilteredPersonInField(filtered);
  }, [selectedHammerSectionField, usersJoinedTheField, selectedMachine]);

  const renderArea = () => {
    if (areaName === "buzlama") {
      return (
        <div
          className={`w-full h-full transition-all p-1 tablearea ${theme} border-secondary border-2`}
        >
          <div className="w-full h-full flex gap-x-1">
            {/* grup listesi */}
            <div className="w-1/2 h-full flex flex-col">
              <h1 className="text-center w-full py-2 border-b text-xs">
                Grup Listesi
              </h1>
              <div className="overflow-y-auto h-full">
                {filteredGroupList.map((item, index) => (
                  <div key={index} className="text-black pt-1">
                    <div
                      // status e ve secılı olup olmama durumuna göre css ekledık...
                      className={`p-2 border rounded cursor-pointer ${
                        item.group_status === "3" &&
                        !selectedGroupNo.some(
                          (group) =>
                            group.group_record_id === item.group_record_id
                        )
                          ? "bg-green-500"
                          : ""
                      } ${
                        item.group_status === "4" &&
                        !selectedGroupNo.some(
                          (group) =>
                            group.group_record_id === item.group_record_id
                        )
                          ? "bg-red-500"
                          : ""
                      } ${
                        item.group_status === "5" &&
                        !selectedGroupNo.some(
                          (group) =>
                            group.group_record_id === item.group_record_id
                        )
                          ? "bg-gray-500"
                          : ""
                      } ${
                        selectedGroupNo.some(
                          (group) =>
                            group.group_record_id === item.group_record_id
                        )
                          ? "bg-blue-200"
                          : "bg-gray-100"
                      }`}
                      onClick={() =>
                        handleOrderFilteredByGroup({
                          group_record_id: item.group_record_id,
                          group_status: item.group_status,
                          group_no: item.group_no,
                        })
                      }
                    >
                      <span className="font-bold">
                        Makine: {item.machine_name}
                      </span>
                      <span className="block">Grup No: {item.group_no}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* sipariş listesi */}
            <div className="w-1/2 h-full">
              <div className="flex flex-col h-full w-full">
                <span className="text-center w-full block text-xs border-b">
                  Seçili Grup İçerisindeki Siparişler
                </span>
                <div className="w-full overflow-y-auto h-full pt-1 text-black">
                  <ul className="w-full h-full overflow-y-auto">
                    {filteredGroup?.map((item, index) => (
                      <ol
                        className={`w-full py-3 px-2 shadow-md border-b bg-gray-100`}
                        key={index}
                      >
                        {item.order_no}
                      </ol>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          className={`w-full h-full transition-all p-1 tablearea ${theme} border-secondary border-2`}
        >
          <div className="w-full h-full flex gap-x-1">
            {/* grup listesi */}
            {areaName === "cekic" && (
              <div className="w-1/2 h-full flex flex-col">
                <h1 className="text-center w-full py-2 border-b text-xs">
                  Alan Seçimi
                </h1>
                {/* alanlar */}
                <div className="overflow-y-auto h-full">
                  <ul>
                    {cekicAreas.map((item, index) => (
                      <li
                        className={`w-full py-2 h-16 items-center flex justify-center cursor-pointer hover:bg-green-500 text-[20px] text-black border-b-2 font-bold border-black ${
                          selectedHammerSectionField === item.name
                            ? "bg-green-500 "
                            : `listeleman ${theme}`
                        }`}
                        key={item.id}
                        onClick={() => handleSelectedArea(item.name)}
                      >
                        {item.field}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {/* TEL CEKMEEEEEE */}
            {(areaName !== "telcekme" ||
              (areaName === "telcekme" && selectedMachine?.machine_name)) && (
              <div
                className={`${
                  areaName === "cekic" ? "w-1/2" : "w-full"
                } h-full`}
              >
                <div className="flex flex-col h-full w-full">
                    <span className="text-center w-full py-2 border-b text-xs">
                      {!areaName === "telcekme"
                        ? "Operatörler"
                        : `${selectedMachine?.machine_name ? selectedMachine.machine_name : selectedHammerSectionField } deki operatörler`}
                    </span>
                  
                  <ul className="w-full overflow-y-auto h-full pt-1 text-black flex flex-col">
                    {filteredPersonInField &&
                      filteredPersonInField.map((item, index) => (
                        <li
                          key={index}
                          onClick={() =>
                            handleSelectedPersonInField(item.operator_id)
                          }
                          className={`h-12 overflow-y-auto cursor-pointer border-b border-black px-2 flex items-center rounded-sm ${
                            item.operator_id === selectedPersonInField
                              ? "bg-green-500"
                              : `listeleman ${theme}`
                          }`}
                        >
                          {item.operator_id}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
  };

  return renderArea();
}

export default GroupArea;
