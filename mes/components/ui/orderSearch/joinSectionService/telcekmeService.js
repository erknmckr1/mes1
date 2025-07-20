import axios from "axios";
// Telçekme alanına katılmak için gerekli işlemleri yapacak metot...
export const checkTelcekmeParticipation = async (areaName, user) => {
  if (areaName !== "telcekme") return false;
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/check-participation`,
      { user_id: user.id_dec, areaName }
    );
    if (res.data.joined) {
      toast.error(res.data.message);
      dispatch(setUser(null));
      return true;
    }
  } catch (err) {
    console.log("Katılım hatası:", err);
  }
  return false;
};

// Telçekme alanına katılma işlemi
export const joinTelcekmeSection = async ({
  orderId,
  uniqId,
  dispatch,
  setUser,
  toast,
  selectedPartners,
  user,
  sectionName,
  areaName,
  selectedMachine,
  selectedHammerSectionField,
  getJoinTheField,
}) => {
  try {
    const partnerIds = selectedPartners.map((p) => p.id_dec);
    const userIds = [user.id_dec, ...partnerIds];
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/order/join-section`,
      {
        section: sectionName,
        areaName,
        user_id: userIds,
        machine_name: selectedMachine?.machine_name,
        workIds: [orderId],
        uniqIds: [uniqId],
        field: selectedHammerSectionField,
      }
    );
    if (res.status === 200) {
      toast.success("Bölüme katılım başarılı.");
      dispatch(getJoinTheField({ areaName }));
      return true;
    }
  } catch (err) {
    toast.error(
      err.response?.data?.message || "Katılım işlemi başarısız oldu."
    );
    dispatch(setUser(null));
  }
  return false;
};
