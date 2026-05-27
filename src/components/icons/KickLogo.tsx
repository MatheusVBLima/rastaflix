import { cn } from "@/lib/utils";

interface KickLogoProps {
  className?: string;
}

/**
 * Renders the Kick logo as an inline SVG that inherits the current text color.
 *
 * @param className - Optional additional CSS class names applied to the SVG; merged with the component's default sizing class.
 * @returns The SVG element for the Kick logo
 */
export function KickLogo({ className }: KickLogoProps) {
  return (
    <svg
      viewBox="0 0 933 300"
      fill="none"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 0H100V66.6667H133.333V33.3333H166.667V0H266.667V100H233.333V133.333H200V166.667H233.333V200H266.667V300H166.667V266.667H133.333V233.333H100V300H0V0ZM666.667 0H766.667V66.6667H800V33.3333H833.333V0H933.333V100H900V133.333H866.667V166.667H900V200H933.333V300H833.333V266.667H800V233.333H766.667V300H666.667V0ZM300 0H400V300H300V0ZM533.333 0H466.667V33.3333H433.333V266.667H466.667V300H533.333H633.333V200H533.333V100H633.333V0H533.333Z"
        fill="currentColor"
      />
    </svg>
  );
}
