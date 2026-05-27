import { getIsAdmin } from "@/lib/auth";
import { Header } from "@/components/Header";

/**
 * Renders the Header component with the current user's admin status.
 *
 * @returns The Header JSX element with `isAdmin` set to `true` if the current user has admin privileges, `false` otherwise.
 */
export async function HeaderShell() {
  const isAdmin = await getIsAdmin();
  return <Header isAdmin={isAdmin} />;
}
