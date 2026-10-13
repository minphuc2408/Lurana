import { LoginForm } from "./LoginForm";
import { Link } from "react-router";
import { Flower, ArrowLeft } from "lucide-react";
import type { LoginModel } from "../hooks/useLogin";
export function LoginView(model: LoginModel) {
  const {
    bgImage
  } = model;
  return <div className="font-body [min-height:100vh] [display:flex]">
      {/* Left: Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 py-12 bg-lunara-cream [max-width:540px] [margin:0_auto]">
        {/* Back to Home */}
        <div className="w-full mb-6 [max-width:420px]">
          <Link to="/" className="inline-flex items-center gap-1.5 [text-decoration:none] [font-size:0.8rem] text-lunara-body [letter-spacing:0.05em]">
            <ArrowLeft size={14} /> Back to Home
          </Link>
        </div>

        {/* Logo */}
        <div className="mb-10 text-center">
          <Link to="/" className="inline-flex items-center gap-2 [text-decoration:none]">
            <Flower size={28} className="text-lunara-rose-strong" />
            <span className="font-display [font-size:2.2rem] [font-weight:600] text-lunara-ink [letter-spacing:0.1em]">
              lunara
            </span>
          </Link>
          <p className="text-lunara-body [font-size:0.85rem] [margin-top:6px]">
            Where every bloom tells a story
          </p>
        </div>

        <LoginForm {...model} />
      </div>

      {/* Right: Image Panel */}
      <div className="hidden md:flex flex-1 relative items-end relative"><img src={bgImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div className="[position:absolute] [inset:0] [background:linear-gradient(to_bottom,_transparent_30%,_rgba(61,34,40,0.8))]" />
        <div className="relative z-10 p-12">
          <p className="font-display [font-size:1.8rem] text-white [font-style:italic] [line-height:1.4] [max-width:340px]">
            "Flowers are the music of the ground, from earth's lips spoken without sound."
          </p>
          <p className="text-lunara-rose-light [font-size:0.82rem] [margin-top:12px]">— Edwin Curran</p>
        </div>
      </div>
    </div>;
}
