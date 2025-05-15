const StoppedWorksLogs = require("../../models/StoppedWorksLog");

//! Durdurulan bir iş bitirilirken yada iptal edilirken aksiyn gerceklesecek ıs durdurulmus mu dıye kontrol edecek fonksiyon
const closeOpenStops = async ({uniq_id, closeDate}) => {
  const stoppedWork = await StoppedWorksLogs.findAll({
    where: {
      stop_end_date: null,
      work_log_uniq_id: uniq_id,
    },
  });

  for (const stop of stoppedWork) {
    await StoppedWorksLogs.update(
      {
        stop_end_date: closeDate,
      },
      {
        where: {
          stop_end_date: null,
          work_log_uniq_id: stop.work_log_uniq_id,
        },
      }
    );
  }
};

module.exports = {
  closeOpenStops,
};
