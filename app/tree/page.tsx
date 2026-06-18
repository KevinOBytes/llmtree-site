import type { Metadata } from "next";
import { TreeView } from "@/components/tree/TreeView";

export const metadata: Metadata = {
  title: "Model Family Trees",
  description:
    "Interactive dendrogram showing the lineage of every frontier AI model family — GPT, Claude, Gemini, LLaMA, Mistral, and more.",
};

export default function TreePage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <TreeView />
    </div>
  );
}
