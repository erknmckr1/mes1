const WorkLog = require("../models/WorkLog");



//! Ortak kullanılan fonksiyon
const generateUniqueId = async () => {
  const latestWorkLog = await WorkLog.findOne({ order: [["uniq_id", "DESC"]] });
  if (latestWorkLog) {
    const latestId = parseInt(latestWorkLog.uniq_id, 10);
    return String(latestId + 1).padStart(6, "0");
  }
  return "000001";
};

//! cekic ekranı ıcın ıs olusturacak servis...
const createCekicWorkLog = async ({
  work_info,
  currentDateTimeOffset,
  field,
}) => {
  const newUniqId = await generateUniqueId();
  const {
    user_id_dec,
    op_username,
    order_id,
    section,
    area_name,
    work_status,
    process_id,
    process_name,
    machine_name,
    production_amount,
  } = work_info;

  return await WorkLog.create({
    uniq_id: newUniqId,
    user_id_dec: user_id_dec,
    op_username: op_username,
    order_no: order_id,
    section: section,
    area_name: area_name,
    work_status: work_status,
    process_id: process_id,
    work_start_date: currentDateTimeOffset,
    process_name: process_name,
    production_amount: production_amount,
    machine_name,
    uniq_id: newUniqId,
    setup_start_date: currentDateTimeOffset,
    field,
  });
};

module.exports = {
  createCekicWorkLog,
};
