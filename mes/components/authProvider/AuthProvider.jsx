"use client";
import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import axios from "axios";
import { setUserInfo, fetchUserPermissions } from "@/redux/userSlice";
import Loading from "../ui/Loading";
import LoginPopUp from "../auth/LoginPopUp";
import { useSearchParams,usePathname } from "next/navigation";

const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // login popup ının durumunu tutacak state...
  const [isLoading, setIsLoading] = useState(true); // loading
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel");
  const areaName = usePathname().split("/")[3]; 
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        if (areaName === "cila" && panel) {
          // CILA özel: Session'dan kullanıcıyı al
          const storedUser = sessionStorage.getItem(`cila-panel-user-${panel}`);
          console.log(storedUser)
          if (storedUser) {
            const user = JSON.parse(storedUser);
            setIsLoggedIn(true);
            dispatch(setUserInfo(user));
            dispatch(fetchUserPermissions(user.id_dec));
            return;
          } else {
            setIsLoggedIn(false);
            return;
          }
        }
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/user/check-login`,
          {
            withCredentials: true,
          }
        );
        if (response.status === 200) {
          setIsLoggedIn(response.data.isLoggedIn);
          dispatch(setUserInfo(response.data.currentUser));
          dispatch(fetchUserPermissions(response.data.currentUser.id_dec)); // İzinleri al ve store'a ekle
        }
      } catch (error) {
        console.error("Login check failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, [dispatch]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      {children}
      {!isLoggedIn && <LoginPopUp setIsLoggedIn={setIsLoggedIn} />}
    </>
  );
};

export default AuthProvider;
