import React from "react";
import { CgMenuRight } from "react-icons/cg";
import { FaEdit, FaPaperPlane, FaUserSecret } from "react-icons/fa";
import { useState } from "react";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdDynamicFeed,
} from "react-icons/md";
import { BsCheckCircle } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { FaRegUser } from "react-icons/fa";
import { setSelectedFlow, setSurveyPopup } from "@/redux/globalSlice";
import { setSelectedManagement } from "@/redux/workFlowManagement";
import Button from "../ui/Button";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";
import { TbNurse, TbDeviceAnalytics } from "react-icons/tb";
import { FcOvertime } from "react-icons/fc";
import Link from "next/link";
function HomeSidebars() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobil side barı acıp kapatacak metot...
  const [isMesaiOpen, setIsMesaiOpen] = useState(false); // mesai menusunu acılıp kapanmasını yonetecek state
  const [isIzinOpen, setIsIzinOpen] = useState(false); // izin menusunu acılıp kapanmasını yonetecek state
  const [İsSatinAlma, setIsSatinAlmaOpen] = useState(false); // satın alma menusunu acılıp kapanmasını yonetecek state
  const { selectedFlow } = useSelector((state) => state.global);
  const { selectedManagement } = useSelector((state) => state.flowmanagement);
  const dispatch = useDispatch();
  const { userInfo, permissions } = useSelector((state) => state.user);
  const pathName = usePathname();

  // Tıklanan menuye göre ilgili stateleri günceller.
  const toggleSection = (flow) => {
    switch (flow) {
      case "mesai":
        setIsMesaiOpen(!isMesaiOpen);
        setIsIzinOpen(false);
        setIsSatinAlmaOpen(false);
        break;
      case "izin":
        setIsMesaiOpen(false);
        setIsIzinOpen(!isIzinOpen);
        setIsSatinAlmaOpen(false);
        break;
      case "satinAlma":
        setIsMesaiOpen(false);
        setIsIzinOpen(false);
        setIsSatinAlmaOpen(!İsSatinAlma);
        break;
      case "anket":
        dispatch(setSurveyPopup(true)); // anket popup ının durumunu tutacak state...
        break;
      default:
        break;
    }
  };

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

  const seeAll = permissions.includes("Görme");
  const onay1 = permissions.includes("1. Onay");
  const onay2 = permissions.includes("2. Onay");
  const mesaiOlusturma = permissions.includes("MesaiOlusturma");
  const mesaiOnaylama = permissions.includes("MesaiOnaylama");
  const mesaidarisler = permissions.includes("Mesaidarisler");
  const guvenlikEkranı = permissions.includes("Guvenlik");

  // HandleMesaiClick fonksiyonunu ekleyelim
  const handleMesaiClick = (click) => {
    if (click === "mesaiOlusturma") {
      if (!mesaiOlusturma) {
        // Yetki yoksa home rotasına yönlendir ve toast göster
        toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır!");
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home`;
        return;
      }
      // Yetkisi varsa ilgili rotaya yönlendir
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home/mesaiyonetimi/mesaiolustur`;
    } else if (click === "mesaiOnaylama") {
      if (!mesaiOnaylama) {
        toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır!");
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home`;
        return;
      }
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home/mesaiyonetimi/mesaionayla`;
    } else if (click === "idariisler") {
      if (!mesaidarisler) {
        toast.error("Bu sayfaya erişim yetkiniz bulunmamaktadır!");
        window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home`;
        return;
      }
      window.location.href = `${process.env.NEXT_PUBLIC_BASE_URL}/home/mesaiyonetimi/idariisler`;
    }
  };

  const menuItems = [
    {
      label: "İzin Yönetimi",
      icon: <FaPaperPlane />,
      flow: "izin",
      isOpen: isIzinOpen,
      items: [
        {
          label: "İzin Talebi Oluştur",
          icon: <FaEdit />,
          href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/izintalebiolustur`,
        },
        (onay1 || onay2) &&
          userInfo.roleId !== 7 && {
            label: "İzin Talebi Onayla",
            icon: <BsCheckCircle />,
            href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/izintalebionayla`,
          },
        seeAll && {
          label: "Tüm İzin Talepleri (İK)",
          icon: <MdDynamicFeed />,
          href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/tumizintalepleri`,
        },
        userInfo?.roleId === 7 && {
          label: "Personel İzin Olustur",
          icon: <TbNurse />,
          href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/personelizinolustur`,
        },
        guvenlikEkranı && {
          label: "Çıkış Yapacak P. (Güvenlik)",
          icon: <FaUserSecret />,
          href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/güvenlik`,
        },
      ].filter(Boolean), // filter(Boolean) dizideki tüm truthy değerleri (boş olmayan) tutar ve falsy değerleri (boş olan) kaldırır.
    },
    {
      label: "Mesai Yönetimi",
      icon: <FcOvertime />,
      flow: "mesai",
      isOpen: isMesaiOpen,
      items: [
        {
          label: "Mesai Oluştur",
          icon: <FaEdit />,
          onClick: () => handleMesaiClick("mesaiOlusturma"), // href yerine onClick kullanıyoruz
        },
        {
          label: "Mesai Onayla",
          icon: <BsCheckCircle />,
          onClick: () => handleMesaiClick("mesaiOnaylama"),
        },
        {
          label: "Mesai İdari İşler",
          icon: <BsCheckCircle />,
          onClick: () => handleMesaiClick("idariisler"),
        },
      ],
    },
    {
      label: "Analytics",
      icon: <TbDeviceAnalytics />,
      flow: "analytics",
      href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/analytics`,
    },
    {
      label: "Midas 2024 Memnuniyet Anketi",
      flow: "anket",
      href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/anket`,
    },
    // {
    //   label: "Satın Alma Yönetimi",
    //   icon: <FaMoneyBill />,
    //   flow: "satinAlma",
    //   isOpen: İsSatinAlma,
    //   items: [
    //     { label: "Satın Alma Talebi Oluştur", icon: <FaEdit /> },
    //     { label: "Satın Alma Talebi Onayla", icon: <BsCheckCircle /> },
    //   ],
    // },
    // { label: "Performans Yönetimi", icon: <FcSalesPerformance /> },
    // {
    //   label: "Üretim Ekranları",
    //   icon: <PiScreencastLight className="text-white" />,
    // },
    // { label: "Raporlar", icon: <TbChartInfographic /> },
  ];

  // alt kategory secımını tutacak state...
  const handleSelection = (item) => {
    dispatch(setSelectedFlow(item));
  };
  // menu ıtemı tutacak statee ıtemı gonderen fonksıyon...
  const handleSelectionManagement = (item) => {
    dispatch(setSelectedManagement(item));
  };
  console.log(selectedFlow);
  return (
    <div className="relative h-full">
      <button
        className="sm:hidden fixed top-4 left-4 z-50 bg-black text-white p-2 rounded-md"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <CgMenuRight size={24} />
      </button>
      <div
        className={`absolute sm:static top-0 left-0 h-full z-40 transition-transform transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 w-full bg-black text-white border-r border-secondary`}
      >
        {/* img div */}
        <div className="h-[15%] sm:h-[20%] w-full flex items-center justify-center">
          <img className="lg:w-60 w-40" src="/midas_logo.png" alt="logo" />
        </div>
        <div className="h-auto w-full p-2">
          {/* name & icon */}
          <div className="w-full border-b border-gray-700  pb-10 flex flex-col gap-y-3">
            <div className="w-full flex items-center justify-between  px-3 border-b py-2 border-gray-700 ">
              <span className="">
                <FaRegUser />
              </span>
              <span className="">{userInfo?.op_username}</span>
            </div>
            <Button
              onClick={logoutUser}
              className="bg-red-600 py-2 hover:bg-red-500 "
              children={"Çıkıs Yap"}
            />
          </div>
          {/* Menu list  */}
          <div className="w-full">
            <ul className="w-full">
              {menuItems.map((item, index) => (
                <React.Fragment key={index}>
                  {item.href ? (
                    // Link ile sarmalanmış ana öğe (örneğin Analytics, Anket)
                    <Link
                      href={item.href}
                      className={`border-b border-gray-700 py-3 hover:bg-gray-500 cursor-pointer flex justify-between px-3 ${
                        selectedManagement === item.label ? "bg-gray-700" : ""
                      }`}
                      onClick={() => handleSelectionManagement(item.label)}
                    >
                      <div className="flex gap-x-3 items-center">
                        {item.icon}
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  ) : (
                    // Alt menüsü olan öğeler (örneğin İzin Yönetimi)
                    <>
                      <li
                        onClick={() => {
                          item.flow && toggleSection(item.flow);
                          handleSelectionManagement(item.label);
                        }}
                        className={`border-b border-gray-700 py-3 hover:bg-gray-500 cursor-pointer flex justify-between ${
                          selectedManagement === item.label ? "bg-gray-700" : ""
                        }`}
                      >
                        <div className="flex gap-x-3 items-center">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.items &&
                          (item.isOpen ? (
                            <MdKeyboardArrowLeft className="text-[20px]" />
                          ) : (
                            <MdKeyboardArrowDown className="text-[20px]" />
                          ))}
                      </li>
                      {item.isOpen && item.items && (
                        <ul className="ps-4">
                          {item.items.map((subItem, subIndex) => (
                            <li
                              key={subIndex}
                              onClick={() => {
                                if (subItem.onClick) {
                                  subItem.onClick();
                                  handleSelection(subItem.label);
                                } else if (subItem.href) {
                                  handleSelection(subItem.label);
                                }
                              }}
                            >
                              {subItem.href ? (
                                <Link
                                  href={subItem.href}
                                  className={`mt-1 py-3 ps-2 hover:bg-gray-500 cursor-pointer flex items-center gap-x-2 ${
                                    selectedFlow === subItem.label
                                      ? "bg-gray-700"
                                      : ""
                                  }`}
                                >
                                  {subItem.icon}
                                  {subItem.label}
                                </Link>
                              ) : (
                                <span className="mt-1 py-3 ps-2 hover:bg-gray-500 cursor-pointer flex items-center gap-x-2">
                                  {subItem.icon}
                                  {subItem.label}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </React.Fragment>
              ))}
            </ul>
          </div>
        </div>
        <div className="absolute bottom-0 p-2 border-t border-secondary w-full">
          <div className="flex items-center">
            <span>@Logo</span>
            <span>-name</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomeSidebars;
