import React from 'react'
import { useSelector } from 'react-redux'
function UserCard() {
    const {userInfo} = useSelector(state => state.user);
    console.log(userInfo)
  return (
    <div className="w-1/3 h-[60%]  rounded-lg bg-[#e2806a] shadow-md   ">
          <div className="w-full flex justify-evenly py-10 border-b ">
            <img
              className=" rounded-full h-[100px]"
              src="./avatar2.jpg"
              alt="profilpic"
            />
            {userInfo && <div className="flex flex-col gap-y-2 text-black  ">
              <span className="text-[30px] font-semibold">
                {userInfo.op_username}
              </span>
              <span className="text-xl font-medium">{userInfo.title}</span>
              <span className="text-xl font-medium">{userInfo.op_section}</span>
              <span>{userInfo.id_dec}</span>
              <span className="underline">Yıllık izin bakiyesi:{userInfo.izin_bakiye}</span>
            </div>}
          </div>
          <div className="flex flex-col text-black ">
            <button className=" hover:bg-gray-700 hover:text-white transition-all py-3 ps-4 text-start border-b w-full">
              İzin Taleplerim
            </button>
            <button className=" hover:bg-gray-700 hover:text-white transition-all py-3 ps-4 text-start border-b w-full">
              Geçmiş İzin Taleplerim
            </button>
          </div>
        </div>
  )
}

export default UserCard
