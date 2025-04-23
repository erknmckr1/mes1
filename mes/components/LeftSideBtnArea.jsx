"use client";
import React from "react";
import Image from "next/image";
import Button from "./ui/Button";
import { useSelector } from "react-redux";
import {
  setMolaPopup,
  setCreateLeavePopup,
  setFoodPopupState,
} from "@/redux/globalSlice";
import { useDispatch } from "react-redux";
import axios from "axios";
import { useEffect, useState } from "react";
import {
  fetchOnBreakUsers,
  setİsCurrentBreak,
} from "@/redux/breakOperationsSlice";
import { toast } from "react-toastify";
import { usePathname } from "next/navigation";
import { setUser, setUserIdPopup } from "@/redux/userSlice";
import { getJoinTheField } from "@/redux/orderSlice";

function LeftSideBtnArea() {
  const dispatch = useDispatch();
  const { userInfo, user, userIdPopup } = useSelector((state) => state.user);
  const { onBreak_users, loading, error, isCurrentBreak } = useSelector(
    (state) => state.break
  );

  const { isRequiredUserId } = useSelector((state) => state.global);
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const [retryAction, setRetryAction] = useState(null); // İşlem türü/ismi tutulacak

  useEffect(() => {
    if (retryAction && user && user.id_dec) {
      switch (retryAction) {
        case "openOzelAra":
          openOzelAra();
          break;
        case "returnToBreak":
          returnToBreak();
          break;
        case "openCreateLeavePopup":
          dispatch(setCreateLeavePopup(true));
          break;
      }
      setRetryAction(null); // İşlem tamamlandıktan sonra temizle
    }
  }, [retryAction, user]);

  //! Logout fonksıyonu...
  const logoutUser = async () => {
    try {
      if (confirm("Çıkış yapılsın mı?")) {
        const logout = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/logout`,
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
    if (isRequiredUserId || areaName === "kalite") {
      if (!user || !user.id_dec) {
        dispatch(setUserIdPopup(true));
        setRetryAction("openOzelAra");
        return;
      }
    }
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
  }, [onBreak_users, userInfo, dispatch, user]);

  //! Return to Break
  const returnToBreak = async () => {
    // Güncel tarihi ISO 8601 standardında oluşturur
    const end_time = new Date().toISOString();
    try {
      if (isRequiredUserId || areaName === "kalite") {
        if (!user || !user.id_dec) {
          dispatch(setUserIdPopup(true));
          setRetryAction("returnToBreak");
          return;
        }

        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/returnToBreak`,
          { operator_id: user.id_dec, end_time }
        );

        if (response.status === 200) {
          toast.success(`${user.op_name} moladan dönüş işlemi başarılı.`);
          dispatch(setUser(null));
          dispatch(getJoinTheField({ areaName }));
        }
      } else {
        if (!userInfo || !userInfo.id_dec) {
          toast.error("Kullanıcı bilgileri eksik!");
          return;
        }

        if (isCurrentBreak) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/returnToBreak`,
            { operator_id: userInfo.id_dec, end_time }
          );

          if (response.status === 200) {
            toast.success(`${userInfo.op_name} moladan dönüş işlemi başarılı.`);
            dispatch(setİsCurrentBreak(false));
          }
        } else {
          toast.error("Kullanıcı molada değil veya bilgiler eksik.");
        }
      }
    } catch (err) {
      console.error(err);
      dispatch(setUser(null));
      const errorMessage =
        err.response?.data?.message || "Moladan dönüş işlemi başarısız.";
      toast.error(errorMessage);
    }
  };

  // İzin olusturma popup ını acmak için kullanıcı kimliği kontrolü
  const controllerUserIdForCreateLeavePopup = () => {
    if (!user || !user.id_dec) {
      dispatch(setUserIdPopup(true));
      setRetryAction("openCreateLeavePopup");

      return;
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
      className: "bg-[#E67E22]",
    },
    {
      // onClick: () => {
      //   const currentUrl = window.location.href;
      //   localStorage.setItem("returnUrl", currentUrl); // LocalStorage'a kaydet
      //   window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/izintalebiolustur?returnUrl=${currentUrl}`;
      // },
      children: "İzin Girişi",
      type: "button",
      // disabled: isCurrentBreak,
      onClick: controllerUserIdForCreateLeavePopup,
    },
    {
      onClick: openOzelAra,
      children: "Araya Çık",
      type: "button",
      className: "",
      // disabled: isCurrentBreak,
    },
    {
      onClick: returnToBreak,
      children: "Moladan dön",
      type: "button",
      className: "",
    },
    // {
    //   onClick: "",
    //   children: "Ramat",
    //   type: "button",
    //   className: "",
    //   disabled: isCurrentBreak,
    // },
  ];

  return (
    <div className="flex w-full flex-col items-center h-full ">
      <Image alt="" height={200} width={200} src={`${"/avatar2.jpg"}`} />
      <div className="flex flex-col w-full font-bold items-center justify-center mt-4 lg:pt-1  ">
        <span>User Id: {userInfo && userInfo.id_dec}</span>
        <span className="text-xl uppercase">
          {userInfo && userInfo.op_username}
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
