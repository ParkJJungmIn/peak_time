import { AnswerArchiveList } from "@/components/archive/answer-archive-list";
import { HeroShell } from "@/components/layouts/hero-shell";

export default function ArchivePage() {
  return (
    <HeroShell tagline="기록을 다시 돌아보세요">
      <section className="px-6 py-8">
        <AnswerArchiveList />
      </section>
    </HeroShell>
  );
}
