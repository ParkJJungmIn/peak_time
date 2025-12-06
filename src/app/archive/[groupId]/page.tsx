import { Suspense } from "react";
import ArchiveDetail from "@/components/archive/archive-detail";

export default function ArchiveDetailPage() {
  return (
    <Suspense fallback={null}>
      <ArchiveDetail />
    </Suspense>
  );
}
