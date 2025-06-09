import { useState } from "react";

const useFinishedWorkState = () => {
  const [repairReasonsList, setRepairReasonsList] = useState([]);
  const [selectedScrapReason, setSelectedScrapReason] = useState("");
  const [finishedAmount, setFinishedAmount] = useState(0);
  const [scrapAmount, setScrapAmount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [repairAmount, setRepairAmount] = useState(0);
  const [desc, setDesc] = useState("");
  const [repairReasons, setRepairReasons] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [retryAction, setRetryAction] = useState(null);
  const [selectedArea, setSelectedArea] = useState("");

  // Tek seferde popup durumunu sıfırlamak için yardımcı fonksiyon
  const resetFinishedPopupState = () => {
    setRepairAmount(0);
    setScrapAmount(0);
    setFinishedAmount(0);
    setProductCount(0);
    setSelectedScrapReason("");
    setRepairReasons(["", "", "", "", "", "", ""]);
    setDesc("");
    setRetryAction(null);
  };

  return {
    repairReasonsList,
    setRepairReasonsList,
    selectedScrapReason,
    setSelectedScrapReason,
    finishedAmount,
    setFinishedAmount,
    scrapAmount,
    setScrapAmount,
    productCount,
    setProductCount,
    repairAmount,
    setRepairAmount,
    desc,
    setDesc,
    repairReasons,
    setRepairReasons,
    retryAction,
    setRetryAction,
    resetFinishedPopupState,
    selectedArea,
    setSelectedArea,
  };
};

export default useFinishedWorkState;
