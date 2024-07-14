import React from 'react'
import Button from "@/components/ui/Button";
import { FaCircleUser } from "react-icons/fa6";
import { FaSearch, FaEdit, FaMoneyBill, FaPaperPlane } from "react-icons/fa";
import { useState } from "react";
import Input from "@/components/ui/Input";
import { MdKeyboardArrowDown, MdKeyboardArrowLeft } from "react-icons/md";
import { BsCheckCircle } from "react-icons/bs";
import { FcOvertime, FcSalesPerformance } from "react-icons/fc";
import { PiScreencastLight } from "react-icons/pi";
import { TbChartInfographic } from "react-icons/tb";
function HomeSidebars() {
    const [isMesaiOpen, setIsMesaiOpen] = useState(false);
    const [isIzinOpen, setIsIsınOpen] = useState(false);
    const [İsSatinAlma, setİsSatinAlma] = useState(false);
  
    const toggleMesai = () => {
      setIsMesaiOpen(!isMesaiOpen);
    };
  
    const toggleIzin = () => {
      setIsIsınOpen(!isIzinOpen);
    };
    const toggleAlma = () => {
      setİsSatinAlma(!İsSatinAlma);
    };
  return (
    <div className="h-full w-[15%] bg-black text-white relative ">
          {/* img div */}
          <div className="h-[20%] w-full flex items-center justify-center">
            <img className="h-[60%]" src="./midas_logo.png" alt="" />
          </div>
          <div className="h-auto w-full p-2">
            {/* name & icon */}
            <div className="w-full flex items-center justify-evenly py-5 border-b border-gray-700">
              <FaCircleUser className="text-[30px]" />
              <span className="text-[20px]">Erkan Mustafa Çakir</span>
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
                <li
                  onClick={toggleIzin}
                  className="py-3 hover:bg-gray-700 cursor-pointer flex justify-between"
                >
                  <div className="flex gap-x-3 items-center">
                    <FaPaperPlane className="" />
                    <button>İzin Yönetimi</button>
                  </div>
                  {!isIzinOpen && (
                    <MdKeyboardArrowDown className="text-[20px]" />
                  )}
                  {isIzinOpen && (
                    <MdKeyboardArrowLeft className="text-[20px]" />
                  )}
                </li>
                {isIzinOpen && (
                  <ul className="pl-4">
                    <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-2">
                      <FaEdit />
                      <button>İzin Talebi Oluştur</button>
                    </li>
                    <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-2">
                      <BsCheckCircle />
                      <button> İzin Talebi Onayla</button>
                    </li>
                  </ul>
                )}
                <li
                  className="py-3 hover:bg-gray-700 cursor-pointer flex justify-between"
                  onClick={toggleMesai}
                >
                  <div className="flex items-center gap-x-3">
                    <FcOvertime />
                    <button>Mesai Yönetimi</button>
                  </div>
                  {!isMesaiOpen && (
                    <MdKeyboardArrowDown className="text-[20px]" />
                  )}
                  {isMesaiOpen && (
                    <MdKeyboardArrowLeft className="text-[20px]" />
                  )}
                </li>
                {isMesaiOpen && (
                  <ul className="pl-4">
                    <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-2">
                      <FaEdit />
                      <button>Mesai Olustur</button>
                    </li>
                    <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-2">
                      <BsCheckCircle />
                      <button>Mesai Onayla</button>
                    </li>
                  </ul>
                )}
                <li
                  onClick={toggleAlma}
                  className="py-3 hover:bg-gray-700 cursor-pointer flex justify-between"
                >
                  <div className="flex items-center gap-x-3">
                    <FaMoneyBill />
                    <button>Satin Alma Yönetimi</button>
                  </div>
                  {!İsSatinAlma && (
                    <MdKeyboardArrowDown className="text-[20px]" />
                  )}
                  {İsSatinAlma && (
                    <MdKeyboardArrowLeft className="text-[20px]" />
                  )}
                </li>
                {İsSatinAlma && (
                  <ul className="pl-4">
                    <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-2">
                      <FaEdit />
                      <button>Satin Alma Talebi Olustur</button>
                    </li>
                    <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-2">
                      <BsCheckCircle />
                      <button>Satin Alma Talebi Onayla</button>
                    </li>
                  </ul>
                )}
                <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-3">
                  <FcSalesPerformance />
                  <button>Performans Yönetimi</button>
                </li>
                <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-3">
                  <PiScreencastLight className="text-white" />
                  <button>Üretim Ekranları</button>
                </li>
                <li className="py-3 hover:bg-gray-700 cursor-pointer flex items-center gap-x-3">
                  <TbChartInfographic />
                  <button>Raporlar</button>
                </li>
              </ul>
            </div>
          </div>
          <div className="absolute bottom-0 p-2 border-t w-full">
            <div className="flex items-center">
              <span>@Logo</span>
              <span>-name</span>
            </div>
          </div>
        </div>
  )
}

export default HomeSidebars
