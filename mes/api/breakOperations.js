const pool = require("../lib/dbConnect");

//! Özel ara sebeblerini çekecek query
const getBreakReason = async () => {
  try {
    const breakReason = await pool.query(`SELECT *
	FROM public.break_reason;`);
    return breakReason.rows;
  } catch (err) {
    console.log(err);
  }
};

//! tüm break loglarını getırecek query
const getBreakReasonLog = async () => {
  try {
    const breakLog = await pool.query(`SELECT *
    FROM public.break_log;`);
    return breakLog.rows;
  } catch (err) {
    console.log(err);
  }
};

//! Belirli bir kullanıcıyı molada mı dıye sorgulayacak query... Eğer yoksa yenı bır log atacak
//! varsa mevcut logu donecek...
const getIsUserOnBreak = async (startLog) => {
  const { area_name, operator_id, break_reason_id } = startLog;
  try {
    // bu kısım verı tabanında section tablosu olusturup break_log tablenın section sutunuyla ılıskılendırılebılırdı
    const section = (area_name) => {
      if (area_name === "kalite") {
        return "Montaj";
      }
      return "";
    };

    const isStart = await pool.query(
      `SELECT *
      FROM public.break_log
      WHERE operator_id = $1
        AND end_time IS NULL;`,
      [operator_id]
    );

    if (isStart.rowCount === 0) {
      const createBreak = await pool.query(
        `INSERT INTO public.break_log(
          break_reason_id, operator_id, area_name, section
        ) VALUES ($1, $2, $3, $4) RETURNING *;`,
        [break_reason_id, operator_id, area_name, section(area_name)]
      );
      return createBreak.rows[0]; // Eklenen molayı döndürüyoruz
    } else {
      return isStart.rows[0]; // Zaten kullanıcının aktif bir molası var.
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
};

//! moladaki operatorlerı donen query end_time null ise ve operator_id ile acılmıs bır log var ise
//! operator moladadır.
const onBreakUsers = async () => {
  try {
    const isStart = await pool.query(
      `SELECT *
      FROM public.break_log
      WHERE end_time IS NULL;`
    );
    return isStart.rows;
  } catch (err) {
    console.log(err);
  }
};
//! Giriş yapan kullancı moladaysa moladan donus ıcın gereklı fonksıyon. end_time doldugu zaman mola
//! bitmiş sayılacak...
const returnToBreak = async ({ operator_id, end_time }) => {
  try {
    const returnBreak = await pool.query(
      `UPDATE public.break_log
      SET end_time = $1
      WHERE operator_id = $2 AND end_time IS null;`,
      [end_time, operator_id]
    );
    return returnBreak;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

module.exports = {
  getBreakReason,
  getBreakReasonLog,
  getIsUserOnBreak,
  onBreakUsers,
  returnToBreak,
};
