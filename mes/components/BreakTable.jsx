'use client'
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux'; // Burada useSelector'u import ettiğinizden emin olun
import { fetchOnBreakUsers } from '@/redux/breakOperationsSlice';

function BreakTable() {
  const dispatch = useDispatch();
  const { onBreak_users, loading, error } = useSelector((state) => state.break);

  useEffect(() => {
    dispatch(fetchOnBreakUsers());
  }, [dispatch]);

  if (loading) {
    return <div>Loading...</div>;
  }


  return (
    <table className="min-w-full divide-y divide-gray-200 text-black">
      <thead className="bg-theader text-white font-semibold">
        <tr>
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
      <tbody className="bg-white divide-y divide-gray-200">
        {onBreak_users && onBreak_users.length > 0 ? (
          onBreak_users.map((user, index) => {
            const date = new Date(user.start_date);
            const formattedDate = date.toLocaleDateString(); // Tarihi formatlar
            const formattedTime = date.toLocaleTimeString(); // Saati formatlar

            return (
              <tr className="bg-green-600 text-white font-semibold" key={index}>
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
