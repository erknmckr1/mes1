import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setUser,
  setUserIdPopup,
  setUsersByArea,
  setSelectedPartners,
} from "@/redux/userSlice";
import axios from "axios";
import { toast } from "react-toastify";
import Button from "../ui/Button";
import { usePathname } from "next/navigation";

function UserIdPopup() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const inputRef = useRef();
  const { theme } = useSelector((state) => state.global);
  const { userIdPopup, usersByArea, selectedPartners } = useSelector(
    (state) => state.user
  );
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];

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

  // Bölümdeki kullanıcıları cekecek  fonksiyon
  const handleGetUserWithArea = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/getuserwitharea`,
        {
          params: { areaName },
        }
      );

      if (response.status === 200) {
        dispatch(setUsersByArea(response.data)); // Kullanıcı bilgilerini Redux'a ekle
      }
    } catch (err) {
      console.error("Kullanıcı bilgisi alma hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectedUser = (user) => {
    const isAlreadySelected = selectedPartners.some(
      (selected) => selected.id_dec === user.id_dec
    );

    const updatedPartners = isAlreadySelected
      ? selectedPartners.filter((selected) => selected.id_dec !== user.id_dec)
      : [...selectedPartners, user];

    dispatch(setSelectedPartners(updatedPartners));
  };

  useEffect(() => {
    if (userIdPopup.showOrderDetails) {
      handleGetUserWithArea();
    }
  }, [userIdPopup.showOrderDetails]);

  useEffect(() => {
    inputRef.current.focus(); // Sayfa yüklendiğinde input alanına odaklanır
  }, []);

  const handleClosePopup = () => {
    dispatch(setUserIdPopup(false));
  };

  return (
    <div
      className={`w-screen h-screen top-0 left-0 absolute flex z-[999] items-center justify-center bg-black bg-opacity-75 ${
        theme === "dark" ? "dark-mode" : "light-mode"
      }`}
    >
      <div
        className={`${
          userIdPopup.showOrderDetails
            ? "sm:w-[900px] sm:h-[700px] w-full h-[300px]"
            : "sm:w-[700px] sm:h-[500px] w-full h-[300px]"
        } popup-content bg-gray-900 border border-gray-700 shadow-2xl rounded-xl p-6`}
      >
        <div className="flex flex-col gap-y-8">
          {/* Header */}
          <span className=" uppercase popup-header sm:text-[36px] text-[28px] py-5 text-black shadow-md">
            Operator ID
          </span>

          {/* Input Alanı ve Buton */}
          <div className="flex flex-col  justify-between items-center ">
            <input
              placeholder="Operator ID"
              className="w-full sm:p-5 p-3 text-[28px] text-gray-900 font-semibold placeholder:text-center border border-gray-400 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition-all"
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              onKeyDown={handleGetUser}
              ref={inputRef}
            />
          </div>
          {/* sadece iş başlatırken toplu iş baslatılacaksa ekrana gelecek div && suanlık sadece telcekme ekranında */}
          {/* Eğer sipariş okutulduysa ve iş ortakları seçilecekse kullanıcı listesi göster */}
          {userIdPopup.showOrderDetails && (
            <div className="w-full h-[300px] bg-gray-800 p-4 rounded-lg mt-4 flex gap-x-2">
              {/* Sol Liste */}
              <div className="w-1/2 flex flex-col">
                <span className="text-white text-lg">İş Ortağı Seç</span>
                <div className="mt-2 flex-1 overflow-y-auto max-h-[240px]">
                  {loading ? (
                    <p className="text-gray-400">Yükleniyor...</p>
                  ) : (
                    <ul className="space-y-2">
                      {usersByArea?.length > 0 ? (
                        usersByArea.map((user) => (
                          <li
                            onClick={() => handleSelectedUser(user)}
                            key={user.id}
                            className={`${
                              selectedPartners?.some(
                                (u) => u.id_dec === user.id_dec
                              )
                                ? "bg-green-600 hover:bg-green-500"
                                : "bg-gray-700 hover:bg-gray-600"
                            } text-white p-3 text-center rounded cursor-pointer `}
                          >
                            {user.op_username}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">Kullanıcı bulunamadı</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-full border bg-gray-700 w-1 border-gray-700"></div>

              {/* Sağ Liste */}
              <div className="w-1/2 flex flex-col">
                <span className="text-white text-lg">Seçilen Operatörler</span>
                <div className="mt-2 flex-1 overflow-y-auto max-h-[240px]">
                  {loading ? (
                    <p className="text-gray-400">Yükleniyor...</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedPartners?.length > 0 ? (
                        selectedPartners.map((user) => (
                          <li
                            key={user.id}
                            className="bg-gray-700 text-white p-3 text-center rounded cursor-pointer hover:bg-gray-600"
                          >
                            {user.op_username}
                          </li>
                        ))
                      ) : (
                        <li className="text-gray-400">Kullanıcı bulunamadı</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Kapat Butonu */}
          <div className="flex justify-center mt-4">
            <Button
              onClick={handleClosePopup}
              className="bg-red-600 hover:bg-red-700 w-[200px] text-white text-lg font-semibold px-6 py-3 rounded-lg shadow-lg transition-all duration-300"
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
