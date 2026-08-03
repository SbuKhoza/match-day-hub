import { Trophy, Users, Wallet } from "lucide-react";

import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";

const STATS = [
  { label: "Gameweek points", value: "—", icon: Trophy },
  { label: "Squad value", value: "—", icon: Wallet },
  { label: "Mini-leagues", value: "—", icon: Users },
];

export function FantasyScreen() {
  return (
    <div className="space-y-6">
      <PageHeader title="Fantasy" subtitle="Your squad, transfers and mini-leagues." />

      <div className="grid gap-4 sm:grid-cols-3">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <CardBody>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
              <p className="mt-4 text-3xl font-semibold">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="flex min-h-[280px] flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary">
            <Trophy className="h-6 w-6" />
          </span>
          <h2 className="mt-4 text-xl font-semibold">Squad builder coming next</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The pitch view, transfers and captaincy picks will plug into this layout once the data
            layer is connected.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}