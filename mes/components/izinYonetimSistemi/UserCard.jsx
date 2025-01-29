import React from 'react';
import { useSelector } from 'react-redux';

function UserCard() {
  const { userInfo, user } = useSelector(state => state.user);
  const { isCreateLeavePopup } = useSelector(state => state.global); // Popup açık mı?

  // Eğer popup açıksa, `user` bilgisini kullan, aksi halde `userInfo`
  const activeUser = isCreateLeavePopup && user ? user : userInfo;

  return (
    <div className="hidden sm:block w-1/5 h-[35%] rounded-lg bg-[#F5F7F8] shadow-md p-2 ">
      <div className="w-full h-full flex justify-evenly items-center">
        <div>
          <img
            className="rounded-full h-[100px]"
            src="/avatar2.jpg"
            alt="profilpic"
          />
        </div>

        {activeUser && (
          <div className="flex flex-col justify-center gap-y-2 text-black">
            <span className="text-[25px] font-semibold border-b">
              {activeUser.op_username}
            </span>
            <span className="text-md font-medium">{activeUser.title}</span>
            <span className="text-md font-medium">{activeUser.op_section}</span>
            <span>{activeUser.id_dec}</span>
            <span className="underline">Yıllık izin bakiyesi: {activeUser.izin_bakiye}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserCard;
