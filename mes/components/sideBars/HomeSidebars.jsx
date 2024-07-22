import React from "react";
import { FaCircleUser } from "react-icons/fa6";
import { FaSearch, FaEdit, FaMoneyBill, FaPaperPlane } from "react-icons/fa";
import { useState } from "react";
import Input from "@/components/ui/Input";
import { MdKeyboardArrowDown, MdKeyboardArrowLeft } from "react-icons/md";
import { BsCheckCircle } from "react-icons/bs";
import { FcOvertime, FcSalesPerformance } from "react-icons/fc";
import { PiScreencastLight } from "react-icons/pi";
import { TbChartInfographic } from "react-icons/tb";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setSelectedFlow } from "@/redux/globalSlice";
import { setSelectedManagement } from "@/redux/workFlowManagement";
import Button from "../ui/Button";
function HomeSidebars() {
  const [isMesaiOpen, setIsMesaiOpen] = useState(false);
  const [isIzinOpen, setIsIzinOpen] = useState(false);
  const [İsSatinAlma, setIsSatinAlmaOpen] = useState(false);
  const { selectedFlow } = useSelector((state) => state.global);
  const {selectedManagement} = useSelector(state => state.flowmanagement )
  const dispatch = useDispatch();

  const toggleSection = (flow) => {
    switch (flow) {
      case "mesai":
        setIsMesaiOpen(!isMesaiOpen);
        setIsIzinOpen(false);
        setIsSatinAlmaOpen(false)
        break;
      case "izin":
        setIsMesaiOpen(false);
        setIsIzinOpen(!isIzinOpen);
        setIsSatinAlmaOpen(false)
        break;
      case "satinAlma":
        setIsMesaiOpen(false);
        setIsIzinOpen(false);
        setIsSatinAlmaOpen(!İsSatinAlma)
        break;
      default:
        break;
    }
  };

  const menuItems = [
    {
      label: "İzin Yönetimi",
      icon: <FaPaperPlane />,
      flow: "izin",
      isOpen: isIzinOpen,
      items: [
        { label: "İzin Talebi Oluştur", icon: <FaEdit /> },
        { label: "İzin Talebi Onayla", icon: <BsCheckCircle /> },
      ],
    },
    {
      label: "Mesai Yönetimi",
      icon: <FcOvertime />,
      flow: "mesai",
      isOpen: isMesaiOpen,
      items: [
        { label: "Mesai Oluştur", icon: <FaEdit /> },
        { label: "Mesai Onayla", icon: <BsCheckCircle /> },
      ],
    },
    {
      label: "Satın Alma Yönetimi",
      icon: <FaMoneyBill />,
      flow: "satinAlma",
      isOpen: İsSatinAlma,
      items: [
        { label: "Satın Alma Talebi Oluştur", icon: <FaEdit /> },
        { label: "Satın Alma Talebi Onayla", icon: <BsCheckCircle /> },
      ],
    },
    { label: "Performans Yönetimi", icon: <FcSalesPerformance /> },
    {
      label: "Üretim Ekranları",
      icon: <PiScreencastLight className="text-white" />,
    },
    { label: "Raporlar", icon: <TbChartInfographic /> },
  ];

  const handleSelection = (item) => {
    dispatch(setSelectedFlow(item));
  };

  const handleSelectionManagement = (item) => {
    dispatch(setSelectedManagement(item))
    dispatch(setSelectedFlow(""))
  }

  console.log(selectedManagement)
  return (
    <div className="h-full w-[15%] bg-black text-white relative border-r border-secondary ">
      {/* img div */}
      <div className="h-[20%] w-full flex items-center justify-center">
        <img className="h-[60%]" src="./midas_logo.png" alt="" />
      </div>
      <div className="h-auto w-full p-2">
        {/* name & icon */}
        <div className="w-full border-b border-gray-700  pb-10 flex flex-col gap-y-3">
          <div className="w-full flex items-center justify-evenly  ">
            <FaCircleUser className="text-[30px]" />
            <span className="text-[20px]">Erkan Mustafa Çakir</span>
          </div>
          <Button className="bg-red-600 py-2 hover:bg-red-500 " children={"Çıkıs Yap"}/>
        </div>
        {/* search area */}
        <div className="flex items-center gap-x-1 py-5 border-b border-gray-700">
          <Input addProps={"h-10 w-[80%]"} placeholder={"Arama"} />
          <div className="h-10 w-[20%]  bg-white text-black">
            <button className="w-full h-full flex items-center justify-center">
              <FaSearch className="text-[20px]" />
            </button>
          </div>
        </div>
        {/* Menu list  */}
        <div className="w-full">
          <ul className="w-full">
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <li
                  onClick={() => {
                    item.flow && toggleSection(item.flow);
                    handleSelectionManagement(item.label)
                  }}
                  className={`py-3 hover:bg-gray-500 cursor-pointer flex justify-between ${
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
                      <li
                        onClick={() => handleSelection(subItem.label)}
                        key={subIndex}
                        className={`py-3 ps-2 hover:bg-gray-500 cursor-pointer flex items-center gap-x-2 ${
                          selectedFlow === subItem.label ? "bg-gray-700" : ""
                        }`}
                      >
                        {subItem.icon}
                        <button>{subItem.label}</button>
                      </li>
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
  );
}

export default HomeSidebars;
