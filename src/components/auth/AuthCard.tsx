import type { ReactNode } from "react";

import { Card, CardBody } from "@/components/common/Card";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="w-full max-w-md shadow-lifted">
      <CardBody className="p-6 sm:p-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p> : null}
        <div className="mt-6 space-y-4">{children}</div>
        {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
      </CardBody>
    </Card>
  );
}

export function AuthError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{message}</p>
  );
}

export function AuthNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return <p className="rounded-2xl bg-secondary px-4 py-3 text-sm text-foreground">{message}</p>;
}