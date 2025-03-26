import React from "react";
import { setErrorPopup } from "@/redux/globalSlice";
import { useDispatch } from "react-redux";
import { useState,useEffect } from "react";
function ErrorPopup({ message, onClose }) {
  const dispatch = useDispatch();
  const [dots, setDots] = useState(""); // Nokta animasyonu için state
  const handleClosePopup = () => {
    dispatch(setErrorPopup(false));
  };

  useEffect(() => {
    // 500ms'de bir noktaları değiştiren döngü
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => clearInterval(interval); // Popup kapanınca intervali temizle
  }, []);
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md z-[9999]">
      <div className="popup-content w-[90%] max-w-[500px] p-6 rounded-lg shadow-lg bg-white dark:bg-gray-900 relative animate-fadeIn">
        {/* Başlık */}
        <div className="popup-header flex justify-between items-center border-b pb-3">
          <h2 className="text-2xl font-bold text-red-600">⚠ Servis Hatası</h2>
          <button
            onClick={handleClosePopup}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition"
          >
            ✖
          </button>
        </div>

        {/* İçerik */}
          {/* İçerik */}
          <div className="popup-body mt-4 text-lg text-gray-800 dark:text-gray-200 text-center">
          Veritabanı bağlantı hatası{dots}
        </div>

        {/* Buton */}
        <div className="mt-6 flex justify-center">
          {/* <button
            onClick={onClose}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md shadow-md transition"
          >
            Kapat
          </button> */}
        </div>
      </div>
    </div>
  );
}

export default ErrorPopup;
