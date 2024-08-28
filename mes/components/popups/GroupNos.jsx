import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setFilteredGroup,
  setGroupListPopup,
  setSelectedGroupNos,
  setSelectedOrderIds,
} from "@/redux/orderSlice";
import Button from "../ui/Button";
import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { usePathname } from "next/navigation";

function GroupNos({ fetchBuzlamaWorks,handleGetGroupList }) {
  const [selectedSendGroup, setSelectedSendGroup] = useState("");
  const { groupList, selectedOrderId, selectedGroupNo } = useSelector(
    (state) => state.order
  );
  const dispatch = useDispatch();
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];

  const handleClosePopup = () => {
    dispatch(setGroupListPopup(false));
  };
  const handleSelectedSendGroup = (group_no) => {
    setSelectedSendGroup(group_no);
  };

  //! Gruba seçili orderları ekleyecek istek
  const handleAddToGroup = async () => {
    const soId = JSON.stringify(selectedOrderId);
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/addToGroup`,
        {
          group_record_id: selectedSendGroup,
          selectedOrderId: soId,
        }
      );
      if (response.status === 200) {
        toast.success(response.data);
        setSelectedSendGroup("");
        dispatch(setSelectedOrderIds([]));
        dispatch(setSelectedGroupNos([]));
        dispatch(setFilteredGroup([]));
        dispatch(setGroupListPopup(false));
        handleGetGroupList();
        dispatch(fetchBuzlamaWorks({ areaName }));
      }
    } catch (err) {
      console.log(err);
      if (err.response && err.response.status === 400) {
        toast.error(err.response.data);
      }
    }
  };

  console.log(selectedSendGroup);
  return (
    <div className="absolute w-full h-full top-0 left-0">
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-[400px] h-[400px] bg-white z-20 rounded-md shadow-md">
          <div className="h-[10%] border-b shadow-md flex justify-center items-center">
            <span className="text-xl text-black">Grup Listesi</span>
          </div>
          <div className="h-[60%] w-full text-black">
            <ul className="w-full h-full">
              {groupList &&
                groupList.map((item, index) => (
                  <ol
                    className={`w-full py-3 px-2 shadow-md border-b cursor-pointer hover:bg-slate-200 ${
                      selectedSendGroup === item.group_record_id ? "bg-slate-300" : ""
                    } `}
                    key={index}
                    onClick={() => {
                      handleSelectedSendGroup(item.group_record_id);
                    }}
                  >
                    {item.group_no}
                  </ol>
                ))}
            </ul>
          </div>
          <div className="h-[30%] grid grid-cols-2 place-content-center place-items-center">
            <Button
              className="w-[150px] bg-blue-500 hover:bg-blue-600 sm:py-2 text-sm"
              children={"Ekle"}
              onClick={handleAddToGroup}
            />
            <Button
              className="w-[150px] bg-red-500 hover:bg-red-600 sm:py-2 text-sm"
              children={"Kapat"}
              onClick={handleClosePopup}
            />
          </div>
        </div>
      </div>
      <div className="absolute top-0 left-0 bg-black opacity-80 w-full h-full z-10"></div>
    </div>
  );
}

export default GroupNos;
