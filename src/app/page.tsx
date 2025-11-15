import { HeroHeader } from "@/components/mobile/hero-header";
import QuestionnaireCard from "@/components/questionnaire/questionnaire-card";

const footerLinks = [
  "피크타임 공유하기",
  "이용약관",
  "개인정보 보호정책",
  "문의하기",
];

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#f22127] flex justify-center items-center px-4 py-10">
      <div className="relative w-full max-w-md rounded-[36px] bg-gradient-to-b from-[#0d0d0f] to-[#040404] text-white shadow-[0_25px_80px_rgba(255,39,34,0.65)] border border-white/5">
        <HeroHeader />

        <div className="mt-6 border-y border-white/10 text-center px-6 py-5 text-sm tracking-wide text-white/80">
          인생을 바꾸는 하루 5분 루틴
        </div>

        <QuestionnaireCard />

        <footer className="px-6 pb-10 pt-4 space-y-4 text-center text-sm text-white/70">
          {footerLinks.map((link) => (
            <p key={link} className="hover:text-white transition-colors">
              {link}
            </p>
          ))}
        </footer>
      </div>
    </div>
  );
}
