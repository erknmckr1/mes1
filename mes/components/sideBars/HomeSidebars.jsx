import React from "react";
import { CgMenuRight } from "react-icons/cg";
import { FaEdit, FaPaperPlane } from "react-icons/fa";
import { useState } from "react";
import {
  MdKeyboardArrowDown,
  MdKeyboardArrowLeft,
  MdDynamicFeed,
} from "react-icons/md";
import { BsCheckCircle } from "react-icons/bs";
import { useSelector, useDispatch } from "react-redux";
import { FaRegUser } from "react-icons/fa";
import { setSelectedFlow } from "@/redux/globalSlice";
import { setSelectedManagement } from "@/redux/workFlowManagement";
import Button from "../ui/Button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "react-toastify";

function HomeSidebars() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // mobil side barı acıp kapatacak metot...
  const [isMesaiOpen, setIsMesaiOpen] = useState(false); // mesai menusunu acılıp kapanmasını yonetecek state 
  const [isIzinOpen, setIsIzinOpen] = useState(false);  // izin menusunu acılıp kapanmasını yonetecek state 
  const [İsSatinAlma, setIsSatinAlmaOpen] = useState(false);  // satın alma menusunu acılıp kapanmasını yonetecek state 
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
      default:
        break;
    }
  };

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

  const seeAll = permissions.includes("Görme");
  const onay1 = permissions.includes("1. Onay");
  const onay2 = permissions.includes("2. Onay");

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
        (onay1 || onay2) && {
          label: "İzin Talebi Onayla",
          icon: <BsCheckCircle />,
          href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/izintalebionayla`,
        },
        seeAll && {
          label: "Tüm İzin Talepleri (İK)",
          icon: <MdDynamicFeed />,
          href: `${process.env.NEXT_PUBLIC_BASE_URL}/home/izinyonetimi/tumizintalepleri`,
        },
      ].filter(Boolean), // filter(Boolean) dizideki tüm truthy değerleri (boş olmayan) tutar ve falsy değerleri (boş olan) kaldırır.
    },
    // {
    //   label: "Mesai Yönetimi",
    //   icon: <FcOvertime />,
    //   flow: "mesai",
    //   isOpen: isMesaiOpen,
    //   items: [
    //     { label: "Mesai Oluştur", icon: <FaEdit /> },
    //     { label: "Mesai Onayla", icon: <BsCheckCircle /> },
    //   ],
    // },
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

  console.log({selectedManagement:selectedManagement , selectedFlow:selectedFlow})

  const handleSelection = (item) => {
    dispatch(setSelectedFlow(item));
  };

  const handleSelectionManagement = (item) => {
    dispatch(setSelectedManagement(item));
  };

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
        } sm:translate-x-0 w-64 bg-black text-white border-r border-secondary`}
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
                      <button>{item.label}</button>
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
                        <Link
                          onClick={() => handleSelection(subItem.label)}
                          href={`${subItem.href}`}
                        >
                          <li
                            key={subIndex}
                            className={`mt-1 py-3 ps-2 hover:bg-gray-500 cursor-pointer flex items-center gap-x-2 ${
                              selectedFlow === subItem.label
                                ? "bg-gray-700"
                                : ""
                            }`}
                          >
                            {subItem.icon}
                            {subItem.label}
                          </li>
                        </Link>
                      ))}
                    </ul>
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
