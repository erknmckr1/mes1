import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setUser, setUserIdPopup } from "@/redux/userSlice";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/Button";
function UserIdPopup() {
  const [id, setId] = useState("");
  const dispatch = useDispatch();
  const inputRef = useRef();
  const { theme } = useSelector((state) => state.global);
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
  };

  return (
    <div
      className={`w-screen h-screen top-0 left-0 absolute flex z-50 items-center justify-center bg-black bg-opacity-75 ${
        theme === "dark" ? "dark-mode" : "light-mode"
      }`}
    >
      <div className="sm:w-[700px] sm:h-[500px] w-full h-[300px] popup-content bg-gray-900 border border-gray-700 shadow-2xl rounded-xl p-6">
        <div className="flex flex-col gap-y-8">
          {/* Header */}
          <span className=" uppercase popup-header sm:text-[36px] text-[28px] py-5 text-black shadow-md">
            Operator ID
          </span>

          {/* Input Alanı ve Buton */}
          <div className="flex flex-col gap-y-6 justify-between items-center h-[200px]">
            <input
              placeholder="Operator ID"
              className="w-full sm:p-5 p-3 text-[28px] text-gray-900 font-semibold placeholder:text-center border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={handleGetUser}
              ref={inputRef}
            />

            {/* Kapat Butonu */}
            <Button
              onClick={handleClosePopup}
              className="bg-red-600 hover:bg-red-700 text-white text-lg font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300"
            >
              Kapat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserIdPopup;
