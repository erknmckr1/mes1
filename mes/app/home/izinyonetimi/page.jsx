'use client'
import React from 'react'
import { useSelector } from 'react-redux'
import LeaveManagement from '@/components/izinYonetimSistemi/LeaveManagement'

export default function İzinYönetimi() {
    const {selectedManagement} = useSelector(state => state.flowmanagement )
    return (
        <div className="w-full h-full flex justify-center">
          { selectedManagement === "İzin Yönetimi"  &&  <LeaveManagement/>}
        </div>
    );
  }
