import { useState } from "react";
import type { FormData } from "../custom-order.types";
import { getCustomOrderDemoData } from "../custom-order.service";
export function useCustomOrder() {
  const {
    occasions,
    colorSchemes,
    flowerTypes,
    sizes
  } = getCustomOrderDemoData();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    occasion: "",
    colors: [],
    flowers: [],
    size: "",
    budget: "",
    date: "",
    recipient: "",
    message: "",
    name: "",
    email: "",
    phone: ""
  });
  const totalSteps = 4;
  const toggleArray = (key: "colors" | "flowers", value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key].filter(v => v !== value) : [...prev[key], value]
    }));
  };
  const resetRequest = () => {
    setSubmitted(false);
    setStep(1);
    setFormData({
      occasion: "",
      colors: [],
      flowers: [],
      size: "",
      budget: "",
      date: "",
      recipient: "",
      message: "",
      name: "",
      email: "",
      phone: ""
    });
  };
  const previousStep = () => setStep(Math.max(1, step - 1));
  const continueRequest = () => step === totalSteps ? setSubmitted(true) : setStep(step + 1);
  return {
    step,
    setStep,
    submitted,
    setSubmitted,
    formData,
    setFormData,
    totalSteps,
    toggleArray,
    occasions,
    colorSchemes,
    flowerTypes,
    sizes,
    resetRequest,
    previousStep,
    continueRequest
  };
}
export type CustomOrderModel = ReturnType<typeof useCustomOrder>;
