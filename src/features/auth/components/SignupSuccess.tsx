import { useLocale } from "@/shared/i18n";
import { Link } from "react-router";
import { Check } from "lucide-react";
import type { SignupModel } from "../hooks/useSignup";
export function SignupSuccess(model: SignupModel) {
  const { t } = useLocale("auth");
  const {
    form
  } = model;
  return <div className="font-body [min-height:100vh] [display:flex] [align-items:center] [justify-content:center] bg-lunara-cream">
        <div className="text-center px-8 py-12 rounded-3xl shadow-sm mx-4 bg-white [max-width:440px] [border:1px_solid_#F0DDD5]">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-lunara-blush">
            <Check size={28} className="text-lunara-rose-strong" />
          </div>
          <h2 className="font-display [font-size:2rem] [font-weight:600] text-lunara-ink [margin-bottom:10px]">
            {t("Account Preview Ready")}</h2>
          <p className="text-lunara-body [font-size:0.9rem] [line-height:1.7] [margin-bottom:28px]">
            {t("This is an account form preview for")}{" "}<strong>{form.firstName}</strong>{t(". No account was created. Use a demo account to sign in.")}</p>
          <Link to="/login" className="block py-3 rounded-full bg-lunara-rose-strong text-white [text-decoration:none] [font-size:0.85rem]">
            {t("Sign In to Your Account")}</Link>
        </div>
      </div>;
}
