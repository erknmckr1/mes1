import { NextResponse } from "next/server";

export async function middleware(request) {
  // Kullanıcının token'ını al
  const token = request.cookies.get("token")?.value;

  // Eğer token yoksa yönlendir
  if (!token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  try {
    // Yetki kontrolü için API isteği yap
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/check-permission`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // Eğer yetki yoksa yönlendir
    if (res.status !== 200) {
      console.log("Yetki yok. /home sayfasına yönlendiriliyor.");
      return NextResponse.redirect(new URL("/home", request.url));
    }

    const permissions = await res.json(); // Yanıt JSON formatında dönüyor

    // Gerekli yetki kontrolü
    if (!permissions.includes("MesaiOlusturma")) {
      console.log("Gerekli yetki bulunamadı. /home sayfasına yönlendiriliyor.");
      return NextResponse.redirect(new URL("/home", request.url));
    }
    return NextResponse.next();
  } catch (error) {
    console.error("Hata oluştu:", error);
    return NextResponse.redirect(new URL("/home", request.url));
  }
}

export const config = {
  matcher: ["/home/mesaiyonetimi/mesaiolustur"],
};
