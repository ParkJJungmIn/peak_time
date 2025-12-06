import { HeroShell } from "@/components/layouts/hero-shell";
import QuestionnaireCard from "@/components/questionnaire/questionnaire-card";

export default function Home() {
  return (
    <HeroShell tagline="인생을 바꾸는 하루 5분 루틴">
      <QuestionnaireCard />
    </HeroShell>
  );
}
