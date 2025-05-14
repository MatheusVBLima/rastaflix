import { cn } from "@/lib/utils"

/**
 * Renders a skeleton placeholder div with animated pulse and customizable styling.
 *
 * Combines default skeleton styles with any additional classes and props provided.
 *
 * @param className - Additional CSS classes to apply to the skeleton.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

export { Skeleton }
