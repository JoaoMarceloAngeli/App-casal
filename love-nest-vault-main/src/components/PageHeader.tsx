import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl sm:text-5xl text-foreground">{title}</h1>
        {subtitle && <p className="font-script text-xl sm:text-2xl text-primary mt-1">{subtitle}</p>}
        <div className="ink-divider mt-3 max-w-md" />
      </div>
      {action}
    </div>
  );
}
