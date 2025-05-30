'use client'
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Burada useSelector'u import ettiğinizden emin olun
import { fetchOnBreakUsers } from '@/redux/breakOperationsSlice';
import { usePathname } from 'next/navigation';

function BreakTable() {
  const pathName = usePathname();
  const areaName = pathName.split("/")[3];
  const { user } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const {theme} = useSelector(theme => theme.global)
  const { onBreak_users, loading, error,isCurrentBreak } = useSelector((state) => state.break);

  useEffect(() => {
    dispatch(fetchOnBreakUsers({areaName}));
  }, [dispatch,isCurrentBreak,user]);

  if (loading) {
    return <div>Loading...</div>;
  }


  return (
    <table className={`w-full h-full divide-y divide-gray-200 text-black tablearea border-2 border-secondary ${theme} transition-all`}>
      <thead className={`thead ${theme} font-semibold`}>
        <tr className='flex justify-between'>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Operator
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Ad-Soyad
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Mola çıkış saati
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
            Mola Türü
          </th>
        </tr>
      </thead>
      <tbody className={`divide-y w-full h-full divide-gray-200 overflow-y-auto flex flex-col`}>
        {onBreak_users && onBreak_users.length > 0 ? (
          onBreak_users.map((user, index) => {
            const date = new Date(user.start_date);
            const formattedDate = date.toLocaleDateString(); // Tarihi formatlar
            const formattedTime = date.toLocaleTimeString(); // Saati formatlar

            return (
              <tr className={`${user.break_reason_id === "000003" ? "bg-secondary" : "bg-green-600"}  w-full  text-white font-semibold flex justify-between`} key={index}>
                <td className="px-6 py-3 whitespace-nowrap">{user.operator_id}</td>
                <td className="px-6 py-3 whitespace-nowrap">{user.op_name}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {formattedDate} {formattedTime}
                </td>
                <td className="px-6 py-3 whitespace-nowrap">{user.break_reason_id}</td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-center">
              No users on break
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export default BreakTable;
