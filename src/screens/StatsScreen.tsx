import { PageHeader } from "@/components/common/PageHeader";
import { TopScorersTable } from "@/components/match/TopScorersTable";

export function StatsScreen() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Statistics"
        subtitle="Top scorers and assists across the Premier Soccer League season."
      />
      <TopScorersTable />
    </div>
  );
}