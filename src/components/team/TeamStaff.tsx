import { Card, CardBody } from "@/components/common/Card";
import { EmptyMessage, ErrorMessage, LoadingState } from "@/components/common/DataState";
import { useStaff } from "@/hooks/useMasterData";
import type { MasterStaff } from "@/types/master";

function StaffRow({ member }: { member: MasterStaff }) {
  return (
    <li className="flex items-center gap-3 border-t border-border py-2 text-sm first:border-t-0">
      <span className="min-w-0 flex-1 truncate font-medium">{member.fullName}</span>
      <span className="shrink-0 text-xs text-muted-foreground">{member.nationality ?? "—"}</span>
    </li>
  );
}

/** Imported technical staff for one club, grouped by role. Empty until staff are added. */
export function TeamStaff({ teamId }: { teamId: string | null }) {
  const { data, isLoading, isError, error, refetch } = useStaff(teamId ? { teamId } : {});

  if (!teamId) return null;
  if (isLoading) return <LoadingState label="Loading staff…" />;
  if (isError) {
    return (
      <ErrorMessage
        title="Staff could not be loaded."
        detail={error instanceof Error ? error.message : null}
        onRetry={() => void refetch()}
      />
    );
  }

  const staff = data ?? [];
  if (staff.length === 0) {
    return <EmptyMessage title="No technical staff have been added for this club yet." />;
  }

  const groups = new Map<string, MasterStaff[]>();
  for (const member of staff) {
    const label = member.role === "Other" ? (member.roleRaw ?? "Other") : member.role;
    groups.set(label, [...(groups.get(label) ?? []), member]);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[...groups.entries()].map(([label, members]) => (
        <Card key={label}>
          <CardBody className="p-4">
            <h3 className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              {label}
            </h3>
            <ul>
              {members.map((member) => (
                <StaffRow key={member.staffId} member={member} />
              ))}
            </ul>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}