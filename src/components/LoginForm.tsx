import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/utils/client";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const supabase = createClient();

  async function handleLoginWithDiscord() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Error logging in with Discord:", error.message);
    }
  }

  return (
    <div
      className={cn("flex flex-col items-center justify-center", className)}
      {...props}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Login</CardTitle>
          <CardDescription>
            Acesse sua conta utilizando o Discord.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLoginWithDiscord}
            >
              Login with Discord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
