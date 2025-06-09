import { useState } from "react";

export default function useFireFormLogic(orderData) {
  const [formState, setFormState] = useState({
    orderId: "",
    goldSetting: "",
    entryGramage: "",
    exitGramage: "",
    gold_pure_scrap: "",
    diffirence: "",
  });

  // sadece numeric degerler
  const getOnlyNumeric = (value) => value.replace(/[^0-9.]/g, "");
  const calculateDiff = (entry, exit) => entry - exit;
  const calculateHasFire = (diff, carat) => {
    const caratMultiplier = {
      8: 0.33,
      10: 0.416,
      14: 0.585,
      18: 0.75,
      21: 0.875,
    };
    return diff * (caratMultiplier[carat] || 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = getOnlyNumeric(value);

    const updatedState = { ...formState, [name]: newValue };
    const entry = parseFloat(updatedState.entryGramage || 0);
    const exit = parseFloat(updatedState.exitGramage || 0);
    updatedState.diffirence = calculateDiff(entry, exit);

    if (["gold_pure_scrap", "entryGramage", "exitGramage"].includes(name)) {
      updatedState.gold_pure_scrap = calculateHasFire(
        updatedState.diffirence,
        orderData?.CARAT
      );
    }

    setFormState(updatedState);
  };

  return {
    formState,
    setFormState,
    handleChange,
  };
}
