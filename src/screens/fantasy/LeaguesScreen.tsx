import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Copy, Trophy, Users } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/common/Button";
import { Card, CardBody } from "@/components/common/Card";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState } from "@/components/fantasy/EmptyState";
import { useFantasyDb, useLeagues } from "@/hooks/useFantasy";
import { createLeague, joinLeague } from "@/services/fantasyService";

export function LeaguesScreen() {
  const { db, uid } = useFantasyDb();
  const queryClient = useQueryClient();
  const { data: leagues, isLoading } = useLeagues();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["fantasy", "leagues", uid] });

  const create = useMutation({
    mutationFn: async () => {
      if (!db || !uid) throw new Error("Sign in to create a league.");
      if (name.trim().length < 3) throw new Error("League name must be at least 3 characters.");
      return createLeague(db, uid, name.slice(0, 50));
    },
    onSuccess: async () => {
      setName("");
      await invalidate();
    },
  });

  const join = useMutation({
    mutationFn: async () => {
      if (!db || !uid) throw new Error("Sign in to join a league.");
      if (code.trim().length !== 6) throw new Error("Invite codes are 6 characters.");
      return joinLeague(db, uid, code);
    },
    onSuccess: async () => {
      setCode("");
      await invalidate();
    },
  });

  async function copyCode(value: string) {
    await navigator.clipboard.writeText(value).catch(() => undefined);
    setCopied(value);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Leagues" subtitle="Create a mini-league or join one with an invite code." />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">Create league</h2>
            <input
              value={name}
              maxLength={50}
              onChange={(event) => setName(event.target.value)}
              placeholder="League name"
              className="h-11 w-full rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button block disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? "Creating…" : "Create league"}
            </Button>
            {create.isError ? (
              <p className="text-xs text-destructive">{(create.error as Error).message}</p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-3">
            <h2 className="text-lg font-semibold">Join league</h2>
            <input
              value={code}
              maxLength={6}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="Invite code"
              className="h-11 w-full rounded-full border border-border bg-transparent px-4 text-sm uppercase tracking-widest outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button block variant="outline" disabled={join.isPending} onClick={() => join.mutate()}>
              {join.isPending ? "Joining…" : "Join league"}
            </Button>
            {join.isError ? (
              <p className="text-xs text-destructive">{(join.error as Error).message}</p>
            ) : null}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">My leagues</h2>
          {isLoading ? (
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          ) : leagues && leagues.length > 0 ? (
            <ul className="space-y-2">
              {leagues.map((league) => (
                <li
                  key={league.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-border px-3 py-3"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
                    <Trophy className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{league.name}</p>
                    <p className="text-xs text-muted-foreground">
                      <Users className="mr-1 inline h-3 w-3" />
                      {league.memberUids.length} members · code {league.code}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyCode(league.code)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === league.code ? "Copied" : "Share code"}
                  </button>
                  <Link
                    to="/fantasy/leagues/$leagueId"
                    params={{ leagueId: league.id }}
                    className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground"
                  >
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No leagues yet"
              description="Create your own mini-league or join friends with a 6-character invite code."
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
