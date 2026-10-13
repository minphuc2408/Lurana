import { passwordStrength } from "../auth.service";
import { useState } from "react";
import { getSignupDemoData } from "../signup.service";
export function useSignup() {
  const {
    bgImage
  } = getSignupDemoData();
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
    agree: false
  });
  const [submitted, setSubmitted] = useState(false);
  const strength = passwordStrength(form.password);
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = ["", "#E8453C", "#F5A623", "#7A9E7E", "#3D9970"];
  return {
    showPass,
    setShowPass,
    showConfirm,
    setShowConfirm,
    form,
    setForm,
    submitted,
    setSubmitted,
    strength,
    strengthLabels,
    strengthColors,
    bgImage
  };
}
export type SignupModel = ReturnType<typeof useSignup>;
