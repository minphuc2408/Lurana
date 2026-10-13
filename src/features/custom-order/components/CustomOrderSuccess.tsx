import { useLocale } from "@/shared/i18n";
import { CheckCircle } from "lucide-react";
import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function CustomOrderSuccess(model: CustomOrderModel) {
  const { t } = useLocale("custom-order");
  const {
    setStep,
    setSubmitted,
    formData,
    setFormData,
    resetRequest
  } = model;
  return <div className="bg-lunara-cream [min-height:100vh] [display:flex] [align-items:center] [justify-content:center] font-body">
        <div className="text-center px-8 py-12 rounded-3xl shadow-lg mx-4 bg-white [max-width:520px] [width:100%] [border:1px_solid_#F0DDD5]">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-lunara-blush">
            <CheckCircle size={36} className="text-lunara-rose-strong" />
          </div>
          <h2 className="font-display [font-size:2.2rem] [font-weight:600] text-lunara-ink [margin-bottom:12px]">
            {t("Demo Request Ready")}</h2>
          <p className="text-lunara-body [font-size:0.92rem] [line-height:1.7] [margin-bottom:8px]">
            {t("Thank you,")}{" "}<strong>{formData.name}</strong>{t("! Your flower request preview is ready for")}{" "}<strong>{t(formData.occasion || "a special occasion")}</strong>.
          </p>
          <p className="text-lunara-body [font-size:0.82rem] [margin-bottom:32px]">
            {t("This preview was not submitted. No email will be sent to")}{" "}<strong>{formData.email}</strong>.
          </p>
          <button onClick={resetRequest} className="px-8 py-3 rounded-full bg-lunara-rose-strong text-white [border:none] [cursor:pointer] [font-size:0.85rem]">
            {t("Submit Another Request")}</button>
        </div>
      </div>;
}
