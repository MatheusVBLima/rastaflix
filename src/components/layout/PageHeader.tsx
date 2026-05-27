import type { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * Renders a page header with an icon, a main title, and a supporting description.
 *
 * @param icon - A Lucide icon component to render to the left of the title
 * @param title - The main heading text displayed as an `h1`
 * @param description - Supporting text displayed below the title
 * @returns The header element containing the icon, title, and description
 */
export function PageHeader({ icon: Icon, title, description }: PageHeaderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Icon className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
