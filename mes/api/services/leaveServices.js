const { and } = require('sequelize');
const LeaveReason = require('../../models/LeaveReasons');
const LeaveRecords = require('../../models/LeaveRecords');

//! İzin sebeplerini dönecek fonksiyon
const getLeaveReasons = async () => {
  try {
    const result = await LeaveReason.findAll();
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

//! Yeni izin oluşturacak fonksiyon
const createNewLeave = async (
  formData,
  selectedReason,
  id_dec,
  op_username,
  currentDateTimeOffset
) => {
  const { izinTuru, baslangicTarihi, donusTarihi, aciklama } = formData;
  try {

    const latestLeaveRecord = await LeaveRecords.findOne({
      order: [['leave_uniq_id', 'DESC']],
    });

    let newUniqId;
    if (latestLeaveRecord) {
      const latestId = parseInt(latestLeaveRecord.leave_uniq_id, 10);
      newUniqId = String(latestId + 1).padStart(6, '0'); // 6 haneli sıralı ID oluştur
    } else {
      newUniqId = '000001'; // Eğer kayıt yoksa ilk ID'yi oluştur
    }

    const result = await LeaveRecords.create({
      op_username,
      id_dec,
      leave_uniq_id: newUniqId,
      leave_creation_date: currentDateTimeOffset,
      leave_start_date: baslangicTarihi,
      leave_end_date: donusTarihi,
      leave_reason: selectedReason,
      leave_description: aciklama,
      leave_status: '1',
      leave_type: izinTuru,
    });

    return result;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

//!İlgili kullanıcının bekleyen izin kayıtlarını donecek servis
const getRecordsById = async({id_dec}) => {
    console.log(id_dec)
    try {
        const result = await LeaveRecords.findAll({
            where:{id_dec}
        });

        // result dizi mi ve 0 dan buyuk mu ?
        if(Array.isArray(result) && result.length > 0) {
            return result
        }else{
           return false
        }
    } catch (err) {
        console.error('Error fetching records:', err);
    }
}

module.exports = { getLeaveReasons, createNewLeave,getRecordsById };
