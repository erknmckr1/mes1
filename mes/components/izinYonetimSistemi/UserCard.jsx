import React from 'react'
import { useSelector } from 'react-redux'
function UserCard() {
    const {userInfo} = useSelector(state => state.user);
  return (
    <div className="w-1/3 h-[60%]  rounded-lg bg-[#e2806a] shadow-md   ">
          <div className="w-full flex justify-evenly py-10 border-b ">
            <img
              className=" rounded-full h-[100px]"
              src='/avatar2.jpg'
              alt="profilpic"
            />
            {userInfo && <div className="flex flex-col gap-y-2 text-black  ">
              <span className="text-[35px] font-semibold">
                {userInfo.op_username}
              </span>
              <span className="text-xl font-medium">{userInfo.title}</span>
              <span className="text-xl font-medium">{userInfo.op_section}</span>
              <span>{userInfo.id_dec}</span>
              <span className="underline">Yıllık izin bakiyesi:{userInfo.izin_bakiye}</span>
            </div>}
          </div>
        </div>
  )
}

export default UserCard
