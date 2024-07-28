'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import LeaveManagement from '@/components/izinYonetimSistemi/LeaveManagement'
import { usePathname } from 'next/navigation'
export default function İzinYönetimi() {
  const pathName = usePathname();
  const flow = pathName.split("/")[2]

  console.log(flow)
  const { selectedManagement } = useSelector(state => state.flowmanagement)
  return (
    <div className="w-full h-full flex justify-center">
      {flow === "izinyonetimi" && <LeaveManagement />}
    </div>
  );
}
