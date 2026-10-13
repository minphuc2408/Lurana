import { useLocale } from "@/shared/i18n";
import { SignupForm } from "./SignupForm";
import { SignupSuccess } from "./SignupSuccess";
import { Link } from "react-router";
import { Flower, Check, ArrowLeft } from "lucide-react";
import type { SignupModel } from "../hooks/useSignup";
export function SignupView(model: SignupModel) {
  const { t } = useLocale("auth");
  const {
    submitted,
    bgImage
  } = model;
  if (submitted) {
    return <SignupSuccess {...model} />;
  }
  return <div className="font-body [min-height:100vh] [display:flex]">
      {/* Left: Image */}
      <div className="hidden md:flex flex-1 relative items-end relative"><img src={bgImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="[position:absolute] [inset:0] [background:linear-gradient(to_bottom,_transparent_30%,_rgba(61,34,40,0.8))]" />
        <div className="relative z-10 p-12">
          <div className="flex items-center gap-2 mb-6">
            <Flower size={22} className="text-lunara-rose-light" />
            <span className="font-display [font-size:1.6rem] [font-weight:600] text-white [letter-spacing:0.1em]">lunara</span>
          </div>
          <p className="font-display [font-size:1.7rem] text-white [font-style:italic] [line-height:1.4] [max-width:340px]">
            {t("\"Join our community of flower lovers and bring nature's beauty into every moment.\"")}</p>
          <div className="flex flex-col gap-2 mt-8">
            {["Free account creation", "Exclusive member discounts", "Early access to seasonal collections", "Custom order tracking"].map(b => <div key={b} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center bg-lunara-rose-strong">
                  <Check size={11} color="white" />
                </div>
                <span className="[font-size:0.82rem] text-lunara-rose-light">{t(b)}</span>
              </div>)}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-lunara-cream [max-width:580px] [margin:0_auto]">
        {/* Back to Home */}
        <div className="w-full mb-4 [max-width:460px]">
          <Link to="/" className="inline-flex items-center gap-1.5 [text-decoration:none] [font-size:0.8rem] text-lunara-body [letter-spacing:0.05em]">
            <ArrowLeft size={14} /> {t("Back to Home")}</Link>
        </div>

        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 [text-decoration:none]">
            <Flower size={24} className="text-lunara-rose-strong" />
            <span className="font-display [font-size:2rem] [font-weight:600] text-lunara-ink [letter-spacing:0.1em]">lunara</span>
          </Link>
        </div>

        <SignupForm {...model} />
      </div>
    </div>;
}
