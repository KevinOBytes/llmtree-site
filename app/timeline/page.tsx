import type { Metadata } from "next";
import { TimelineView } from "@/components/timeline/TimelineView";

export const metadata: Metadata = {
  title: "Historical Timeline",
  description:
    "Explore the complete timeline of AI evolution — from foundational research papers through hardware breakthroughs to today's frontier models.",
};

export default function TimelinePage() {
  return (
    <div className="flex-1 flex flex-col">
      <TimelineView />
    </div>
  );
}
