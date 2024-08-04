import React from "react";
import { FaSearch } from "react-icons/fa";
import Input from "@/components/ui/Input";
import { setSelectedRecords,setFilteredText } from "../../../redux/workFlowManagement";
import { useSelector ,useDispatch} from "react-redux";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { PiExportBold } from "react-icons/pi";
function LeaveRangePicker() {
  const [dateRange, setDateRange] = useState({
    start_date: "",
    end_date: "",
  });

  const {records,filteredText} = useSelector((state) => state.flowmanagement);
  const dispatch = useDispatch();

  function handleDateChange(e) {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value,
    });
  }

   function handleSearchChange(e){
     dispatch(setFilteredText(e.target.value))
   }

  console.log(filteredText);

  //! Tarıh aralıgındakı verılerı cekecek query...
  async function handleSearchRangeLeave() {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/leave/getDateRangeLeave`,
        {
          params: {
            leave_start_date: dateRange.start_date,
            leave_end_date: dateRange.end_date,
          },
        }
      );
      if (response.status === 200) {
        dispatch(setSelectedRecords(response.data));
        toast.success("Belirlediğiniz aralıktaki izinli kullanıcılar tabloda.");
      } else if (response.status === 404) {
        toast.dark("Belirlediğiniz aralıkta izinli kullanıcı bulunamadı...");
      }
    } catch (err) {
      console.log(err);
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      dispatch(setSelectedRecords([]))
    }
  }

 
  
  return (
    <div className="w-full h-full text-black flex items-center font-semibold">
      <div className="w-full h-full flex justify-between items-center">
        <div className="flex sm:gap-x-10  gap-x-5 ">
          {/* izin baslangıc */}
          <div className="flex flex-col gap-y-2 py-1">
            <label htmlFor="">İzin Başlangıç</label>
            <input
              onChange={handleDateChange}
              name="start_date"
              value={dateRange.start_date}
              className="w-28 sm:w-[200px] p-2 outline-none"
              type="datetime-local"
            />
          </div>
          {/* izin bitis */}
          <div className="flex flex-col gap-y-2 py-1">
            <label htmlFor="startdate">İzin Bitiş</label>
            <input
              onChange={handleDateChange}
              name="end_date"
              value={dateRange.end_date}
              className=" w-28 sm:w-[200px] p-2 outline-none"
              type="datetime-local"
            />
          </div>
          {/* search btn */}
          <div className="flex flex-col h-full  gap-y-2 py-1">
            <span>-</span>
            <button onClick={handleSearchRangeLeave} className="p-3 bg-white">
              <FaSearch className="text-20px" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LeaveRangePicker;
