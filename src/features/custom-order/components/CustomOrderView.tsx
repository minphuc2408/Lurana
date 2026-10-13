import { ContactStep } from "./ContactStep";
import { DetailsStep } from "./DetailsStep";
import { StyleStep } from "./StyleStep";
import { OccasionStep } from "./OccasionStep";
import { CustomOrderProgress } from "./CustomOrderProgress";
import { CustomOrderSuccess } from "./CustomOrderSuccess";
import { cn } from "@/shared/lib/utils";
import { ChevronRight, ChevronLeft } from "lucide-react";
import type { CustomOrderModel } from "../hooks/useCustomOrder";
import type { FormData } from "../custom-order.types";
export function CustomOrderView(model: CustomOrderModel) {
  const {
    step,
    setStep,
    submitted,
    setSubmitted,
    totalSteps,
    previousStep,
    continueRequest
  } = model;
  if (submitted) {
    return <CustomOrderSuccess {...model} />;
  }
  return <div className="bg-lunara-cream [min-height:100vh] font-body">
      {/* Header */}
      <div className="[background:linear-gradient(135deg,_#F9EDE9_0%,_#F5E8E4_100%)] [padding:60px_24px_40px]">
        <div className="max-w-3xl mx-auto text-center">
          <span className="[font-size:0.75rem] [letter-spacing:0.2em] [text-transform:uppercase] text-lunara-rose-strong">Bespoke Florals</span>
          <h1 className="font-display [font-size:clamp(2rem,_4vw,_3rem)] [font-weight:600] text-lunara-ink [margin-top:8px]">
            Custom Flower Request
          </h1>
          <p className="text-lunara-body [font-size:0.92rem] [margin-top:12px]">
            Tell us your vision and our floral artists will bring it to life
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress Bar */}
        <CustomOrderProgress {...model} />

        <div className="rounded-2xl p-8 bg-white [border:1px_solid_#F0DDD5]">
          {/* Step 1: Occasion */}
          {step === 1 && <OccasionStep {...model} />}

          {/* Step 2: Style */}
          {step === 2 && <StyleStep {...model} />}

          {/* Step 3: Details */}
          {step === 3 && <DetailsStep {...model} />}

          {/* Step 4: Contact */}
          {step === 4 && <ContactStep {...model} />}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button onClick={previousStep} disabled={step === 1} className={cn("flex items-center gap-2 px-6 py-3 rounded-full [border:1px_solid_#F0DDD5] bg-transparent [font-size:0.85rem]", step === 1 ? "text-[#D0C0C4]" : "text-lunara-body", step === 1 ? "[cursor:not-allowed]" : "[cursor:pointer]")}>
              <ChevronLeft size={16} /> Back
            </button>
            <button onClick={continueRequest} className="flex items-center gap-2 px-8 py-3 rounded-full bg-lunara-rose-strong text-white [border:none] [cursor:pointer] [font-size:0.85rem] [letter-spacing:0.08em]">
              {step === totalSteps ? "Submit Request" : "Continue"} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>;
}
