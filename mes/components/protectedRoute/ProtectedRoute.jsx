import React from "react";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

function ProtectedRoute({ requiredPermission, children }) {
  const router = useRouter();
  const permissions = useSelector((state) => state.user.permissions);

  useEffect(() => {
    // Kullanıcının gerekli yetkiye sahip olup olmadığını kontrol et
    if (!permissions.includes(requiredPermission)) {
      toast.error("Bu sayfaya erişim yetkiniz yok!");
      router.push("/home"); // Eğer yetki yoksa ana sayfaya yönlendir
    }
  }, [permissions, requiredPermission]);
  return <>{children}</>;
}

export default ProtectedRoute;
