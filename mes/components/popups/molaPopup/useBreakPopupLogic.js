import { useDispatch, useSelector } from "react-redux";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { setUser } from "@/redux/userSlice";
import { fetchOnBreakUsers } from "@/redux/breakOperationsSlice";
import { setMolaPopup } from "@/redux/globalSlice";
import { getJoinTheField } from "@/redux/orderSlice";
import { getWorkList } from "@/api/client/cOrderOperations";
import { getWorksWithoutId } from "@/redux/orderSlice";
export const useBreakPopupLogic = () => {
  const dispatch = useDispatch();
  const pathname = usePathname();
  const areaName = pathname.split("/")[3];
  const section = pathname.split("/")[2];

  const { userInfo, user } = useSelector((state) => state.user);
  const { isRequiredUserId } = useSelector((state) => state.global);
  const [molaReason, setMolaReason] = useState([]);
  const [araSebebi, setAraSebebi] = useState("");

  // Mola sebeplerini çekecek istek
  const fetchBreakReason = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/breakReason`
      );
      if (res.status === 200) setMolaReason(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    fetchBreakReason();
  }, []);

  //! Molaya cıkıs isteği atacak fonksıyon
  const handleBreakRequest = async (userInfo, araSebebi) => {
    if (!araSebebi) {
      toast.error("Ara sebebini seçmeden işlem yapamazsınız.");
      return;
    }
    const operator = isRequiredUserId ? user : userInfo;

    const payload = {
      break_reason_id: araSebebi,
      operator_id: operator.id_dec,
      op_name: operator.op_username,
      area_name: areaName,
      section,
    };

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/createBreak`,
        payload
      );

      if (res.data.isAlreadyOnBreak) {
        toast.error("Kullanıcı zaten molada...");
        dispatch(setUser(null));
        return;
      }
      await dispatch(fetchOnBreakUsers({ areaName }));
      toast.success(`${operator.op_username} için mola oluşturuldu.`);
      dispatch(setUser(null));
      dispatch(setMolaPopup(false));
      dispatch(getJoinTheField({ areaName }));
      getWorkList({ areaName, userId: userInfo.id_dec, dispatch });
      //Ekranı tek kişi kullanıyorsa o ekranlarda kullanıcı cıkıs da yapsın
      if (areaName === "cila") {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/logout`,
          {},
          { withCredentials: true }
        );
        window.location.href = pathname; // çıkıs yaptıktan sonra aynı sayfaya gıt
      }
    } catch (err) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      dispatch(setUser(null));
    }
  };

  //! Molaya cıkmak ıcın ekranlarda ekstra ıd ıstıyorsak yanı gırıs yapılması ıle ısımız yoksa asagıdakı fonksıyon calısacak
  const createBreakWıthId = async (araSebebi) => {
    if (!araSebebi) {
      toast.error("Ara sebebini seçmeden işlem yapamazsınız.");
      return;
    }
    const startLog = {
      break_reason_id: araSebebi,
      operator_id: user.id_dec,
      area_name: areaName,
      op_name: user.op_username,
      section,
    };
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/createBreak`,
        startLog
      );

      if (response.data.isAlreadyOnBreak === false) {
        await dispatch(fetchOnBreakUsers({ areaName }));
        toast.success(`${user.op_username} için mola oluşturuldu.`);
        dispatch(setUser(null));
        dispatch(setMolaPopup(false));
        dispatch(getJoinTheField({ areaName }));
        dispatch(getWorksWithoutId({ areaName }));
      } else if (response.data.isAlreadyOnBreak === true) {
        toast.error("Bu kullanici zaten molada...");
        dispatch(setUser(null));
      }
    } catch (err) {
      toast.error("Bir hata oluştu. Lütfen tekrar deneyin.");
      console.log(err);
      dispatch(setUser(""));
    }
  };

  const createBreakFunc = () => {
    if (isRequiredUserId || areaName === "kalite") {
      createBreakWıthId(araSebebi);
    } else {
      handleBreakRequest(userInfo, araSebebi);
    }
  };

  // popup ın durumnu kontrol eden state (acık kapalı)
  const closeMolaPopup = () => {
    dispatch(setMolaPopup(false));
    setAraSebebi("");
    dispatch(setUser(null));
  };

  return {
    createBreakFunc,
    molaReason,
    araSebebi,
    closeMolaPopup,
    setAraSebebi,
  };
};
