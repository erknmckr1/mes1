import React, { useState,useRef,useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, setUserIdPopup } from "@/redux/userSlice";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/Button";
function UserIdPopup() {
  const [id, setId] = useState("");
  const dispatch = useDispatch();
  const inputRef = useRef();

  const handleGetUser = async (event) => {
    if (event.key === "Enter") {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/${id}/getuserinfo`
        );

        if (response.status === 200) {
          console.log("Kullanıcı bilgisi başarıyla alındı");
          dispatch(setUser(response.data)); // Kullanıcı bilgilerini Redux'a ekle
          dispatch(setUserIdPopup(false));
        }
      } catch (err) {
        console.error("Kullanıcı bilgisi alma hatası:", err);
        toast.error("Girilen ID'ye sahip bir kullanıcı yok");
      }
    }
  };

  useEffect(() => {
    inputRef.current.focus(); // Sayfa yüklendiğinde input alanına odaklanır
  }, []);

  const handleClosePopup = () => {
    dispatch(setUserIdPopup(false));
  }

  return (
    <div className="w-screen h-screen top-0 left-0 absolute">
      <div className="flex items-center justify-center w-full h-full px-2 sm:px-0">
        <div className="sm:w-[700px] sm:h-[500px] h-[300px] w-full bg-black border-2 border-white p-3 static z-50 rounded-md ">
          <div className="flex flex-col gap-y-10">
            <span className="text-center uppercase sm:text-[40px] text-[30px] py-5 font-semibold bg-secondary">
              Operator ID
            </span>
            <div className="flex   gap-y-10 flex-col justify-between items-center  h-[200px]">
              <input
                placeholder="Operator ID"
                className="sm:p-6 p-3 w-full text-[30px] text-black font-semibold placeholder:text-center"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                onKeyPress={handleGetUser}
                ref={inputRef}
              />
            
                <Button onClick={handleClosePopup} className="bg-red-500 hover:bg-red-600" children={"Kapat"}/>
             
            </div>
          </div>
        </div>
      </div>
      <div className="w-screen h-screen absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default UserIdPopup;
