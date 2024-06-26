"use client";
import React from "react";
import Image from "next/image";
import Button from "./uı/Button";
import { useSelector } from "react-redux";
import { setMolaPopup } from "@/redux/globalSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { useEffect } from "react";
import {
  fetchOnBreakUsers,
  setİsCurrentBreak,
} from "@/redux/breakOperationsSlice";
import { toast } from "react-toastify";
import { setFoodPopupState } from "@/redux/globalSlice";
import { usePathname } from "next/navigation";


function LeftSideBtnArea() {
  const dispatch = useDispatch();
  const userInfo = useSelector((state) => state.user.userInfo);
  const { onBreak_users, loading, error, isCurrentBreak } = useSelector(
    (state) => state.break
  );
  const pathName = usePathname();
  const areaName = pathName.split("/")[2];
  //! Logout fonksıyonu...

 
  const logoutUser = async () => {
    try {
      if (confirm("Çıkış yapılsın mı?")) {
        const logout = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/logout`,
          {}, // Boş bir obje göndermek gerekiyor
          { withCredentials: true } // credentials: 'include' yerine withCredentials kullanılır
        );
        if (logout.status === 200) {
          toast.success(`${userInfo.op_name} başariyla çıkış yaptınız.`);
          window.location.href = pathName; // çıkıs yaptıktan sonra aynı sayfaya gıt 
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const openOzelAra = () => {
    dispatch(setMolaPopup(true));
  };

   // sısteme gırıs yapan kullanıcı moladaysa fonksıyon true donecek ve true ıse butonlar dısabled var.
  useEffect(() => {
    const onBreak = onBreak_users.some(
      (item) => item.operator_id === userInfo?.id_dec
    );
    if (onBreak) {
      dispatch(setİsCurrentBreak(true));
    } else {
      dispatch(setİsCurrentBreak(false));
    }
  }, [onBreak_users, userInfo, dispatch]);

  //! Return to Break
  const returnToBreak = async (operator_id) => {
    // Güncel tarihi ISO 8601 standardında oluşturur
    const end_time = new Date().toISOString();
    try {
      if (isCurrentBreak) {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/returnToBreak`,
          {operator_id, end_time}
        );
        if (response.status === 200) {
          toast.success(`${userInfo.op_name} moladan dönüş işlemi başarılı.`);
          dispatch(setİsCurrentBreak(false));
          await dispatch(fetchOnBreakUsers());
        }
      } else {
        toast.error("Kullanıcı molada değil veya bilgiler eksik.");
      }
    } catch (err) {
      console.log(err);
      toast.error("Moladan dönüş işlemi başarısız.");
    }
  };

  const buttons = [
    {
      onClick: logoutUser,
      children: "Çıkış Yap",
      type: "button",
      className: "bg-red-500 hover:bg-red-600",
    },
    {
      onClick: () => {
        dispatch(setFoodPopupState(true));
      },
      children: "Yemek Menüsü",
      type: "button",
      className: "",
    },
    {
      onClick: "",
      children: "İzin Girişi",
      type: "button",
      disabled: isCurrentBreak,
    },
    {
      onClick: openOzelAra,
      children: "Özel araya çık",
      type: "button",
      className: "",
      disabled: isCurrentBreak,
    },
    {
      onClick: () => returnToBreak(userInfo.id_dec),
      children: "Moladan dön",
      type: "button",
      className: "",
    },
    {
      onClick: "",
      children: "Ramat",
      type: "button",
      className: "",
      disabled: isCurrentBreak,
    },
  ];

  return (
    <div className="flex flex-col items-center h-full ">
      <Image alt="" height={200} width={200} src={`${"/avatar2.jpg"}`} />
      <div className="flex flex-col font-bold items-center pt-1  ">
        <span>User Id: {userInfo && userInfo.id_dec}</span>
        <span className="text-xl uppercase">
          {userInfo && userInfo.op_name}
        </span>
      </div>
      {/* buttons left */}
      <div className="flex flex-col gap-y-3 mt-3 h-full justify-center  ">
        {buttons.map((button, index) => (
          <Button
            key={index}
            onClick={button.onClick}
            children={button.children}
            disabled={button.disabled}
            type={button.type}
            className={button.className}
          />
        ))}
      </div>
    </div>
  );
}

export default LeftSideBtnArea;
