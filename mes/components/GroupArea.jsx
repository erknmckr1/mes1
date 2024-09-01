import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { handleGetGroupList, fetchBuzlamaWorks } from "@/redux/orderSlice";
import { setFilteredGroup, setSelectedGroupNos } from "@/redux/orderSlice";

function GroupArea() {
  const { theme } = useSelector((theme) => theme.global);
  const dispatch = useDispatch();
  const {
    groupList,
    selectedGroupNo,
    buzlamaWork,
    filteredGroup,
    selectedProcess,
    selectedMachine,
  } = useSelector((state) => state.order);
  const { areaName } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(handleGetGroupList());
    dispatch(fetchBuzlamaWorks({ areaName }));
  }, [dispatch, areaName]);

  const handleOrderFilteredByGroup = ({ group_record_id, group_status }) => {
    let updatedSelectedGroupNo = [];

    if (
      selectedGroupNo.some((group) => group.group_record_id === group_record_id)
    ) {
      updatedSelectedGroupNo = selectedGroupNo.filter(
        (group) => group.group_record_id !== group_record_id
      );
    } else {
      updatedSelectedGroupNo = [
        ...selectedGroupNo,
        { group_record_id, group_status },
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
            {groupList.map((item, index) => (
              <div key={index} className="text-black pt-1">
                <div
                  className={`p-2 border rounded cursor-pointer ${
                    selectedGroupNo.some(
                      (group) => group.group_record_id === item.group_record_id
                    )
                      ? "bg-blue-200"
                      : "bg-gray-100"
                  } ${
                    item.group_status === "3" ? "bg-green-500" : ""
                  }  ${
                    item.group_status === "5" ? "bg-gray-500" : ""
                  } `}
                  onClick={() =>
                    handleOrderFilteredByGroup({
                      group_record_id: item.group_record_id,
                      group_status: item.group_status,
                    })
                  }
                >
                  <span className="font-bold">Makine: {item.machine_name}</span>
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
}

export default GroupArea;
