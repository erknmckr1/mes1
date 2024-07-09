import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { setTheme } from "@/redux/globalSlice";
import { CiSun, CiCloudMoon } from "react-icons/ci";

const ThemeButton = () => {
    const dispatch = useDispatch();
    const { theme } = useSelector(theme => theme.global)

    const handleChangeThema = () => {
        dispatch(setTheme(theme === "dark" ? "light" : "dark"))
    }

    console.log(theme)
    return (
        <div className={` items-center justify-center rounded-md flex text-center themabtn  ${theme} transition-all`}>
            {theme === "dark" && <CiCloudMoon className="w-[50px] h-[50px] text-[30px] cursor-pointer" onClick={handleChangeThema} />}
            {theme === "light" && <CiSun className="w-[50px] h-[50px] text-[30px] cursor-pointer" onClick={handleChangeThema} />}
        </div>
    )
};


export default ThemeButton;