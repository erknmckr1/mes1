"use client";
import React, { useEffect,useRef } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { setUserInfo } from "@/redux/userSlice";
import { useDispatch } from "react-redux";
import { setOperatorid } from "@/redux/userSlice";
import { toast } from "react-toastify";

function LoginPopUp({ setIsLoggedIn }) {
  const inputRef = useRef();
  const dispatch = useDispatch();
  //! girilen operator id yi global state'te tutuyoruz.
  const operator_id = useSelector((state) => state.user.operator_id);
  // Oturum tokenı olusturmak ıcın server a ıstek atıp tokenı session kısmına kaydettık. Session da bu token
  // oldugu surece kullanıcı ıslemlerıne devam edebılecek...
  const handleLogin = async (event) => {
    if (event.key === "Enter") {
      console.log("Login fonksiyonu baslatıldı.");
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/login`,  
          {
            operator_id
          },
          {
            withCredentials: true, // Çapraz kaynak isteklerinde kimlik bilgileri göndermek için
          }
        );
        if (response.status === 200) {
          console.log("Login isteği başarılı");
          setIsLoggedIn(true);
          dispatch(setUserInfo(response.data)); 
        }
      } catch (err) {
        console.error("Login hatası:", err);
        toast.error("Girilen id ye sahip bir kullanıcı yok")
      }
    }
  };

  useEffect(()=>{
    inputRef.current.focus();
  },[])
     
  return (
    <div className="w-screen h-screen top-0 left-0 absolute">
      <div className="flex items-center justify-center w-full h-full  ">
        <div className="w-[700px] h-[500px] bg-black border-2 border-white p-3 static z-50 rounded-md ">
          <div className="flex flex-col gap-y-10">
            <span className=" text-center uppercase text-[40px] py-5 font-semibold bg-secondary">
              Operator ID
            </span>
            <div className="flex justify-center">
              <input
                placeholder="Operator ID"
                className="p-6 text-[30px] text-black font-semibold placeholder:text-center"
                type="text"
                onChange={(e) => dispatch(setOperatorid(e.target.value))}
                onKeyPress={handleLogin}
                value={operator_id}
                ref={inputRef}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="w-screen h-screen  absolute bg-black opacity-85 top-0 left-0"></div>
    </div>
  );
}

export default LoginPopUp;
