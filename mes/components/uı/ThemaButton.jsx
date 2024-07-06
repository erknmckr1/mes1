import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "@/redux/globalSlice";
import { useState, useEffect } from "react";
import { CiSun, CiCloudMoon } from "react-icons/ci";

const ThemeButton = () => {
    const dispatch = useDispatch();
    const { theme } = useSelector(theme => theme.global)

    const handleChangeThema = () => {
        dispatch(setTheme(theme === "dark" ? "light" : "dark"))
    }

    console.log(theme)
    return (
        <div className={`w-[50px] h-[50px] text-[30px] items-center justify-center rounded-md flex text-center themabtn  ${theme} transition-all`}>
            {theme === "dark" && <CiCloudMoon onClick={handleChangeThema} />}
            {theme === "light" && <CiSun onClick={handleChangeThema} />}
        </div>
    )
};


export default ThemeButton;