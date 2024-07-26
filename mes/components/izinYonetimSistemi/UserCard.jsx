import React from 'react'
import { useSelector } from 'react-redux'
function UserCard() {
    const {userInfo} = useSelector(state => state.user);
  return (
    <div className="w-1/5 h-[40%]  rounded-lg bg-[#F5F7F8] shadow-md p-2 ">
          <div className="w-full flex justify-between items-center  ">
            <img
              className=" rounded-full h-[100px]"
              src='/avatar2.jpg'
              alt="profilpic"
            />
            {userInfo && <div className="flex flex-col gap-y-2 text-black w-[50%]  ">
              <span className="text-[20px] font-semibold border-b">
                {userInfo.op_username}
              </span>
              <span className="text-md font-medium">{userInfo.title}</span>
              <span className="text-md font-medium">{userInfo.op_section}</span>
              <span>{userInfo.id_dec}</span>
              <span className="underline">Yıllık izin bakiyesi:{userInfo.izin_bakiye}</span>
            </div>}
          </div>
        </div>
  )
}

export default UserCard
