"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import NumberFlow from "@number-flow/react";
import { Palette, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { fetchUserAchievements } from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import { formatDate } from "@/lib/format";

interface UserProfileProps {
  isAdmin: boolean;
}

function initials(name: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function UserProfile({ isAdmin }: UserProfileProps) {
  const { user, isLoaded } = useUser();

  const { data: achievements = [], isLoading: loadingAchievements } = useQuery({
    queryKey: user?.id ? queryKeys.user.achievements(user.id) : ["userAchievements", "pending"],
    queryFn: () => (user?.id ? fetchUserAchievements(user.id) : Promise.resolve([])),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoaded) return <ProfileSkeleton />;

  if (!user) {
    return (
      <EmptyState
        title="Entre para ver seu perfil"
        action={
          <Button asChild>
            <Link href="/sign-in">Entrar</Link>
          </Button>
        }
      />
    );
  }

  const verified =
    user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)?.verification.status ===
    "verified";

  const facts = [
    { label: "Usuário", value: user.username ? `@${user.username}` : "Não definido" },
    { label: "Membro desde", value: formatDate(user.createdAt?.toISOString()) },
    {
      label: "Último acesso",
      value: user.lastSignInAt ? formatDate(user.lastSignInAt.toISOString()) : "Nunca",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Identidade */}
      <section className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="size-20 ring-2 ring-border">
          <AvatarImage src={user.imageUrl} alt="" />
          <AvatarFallback className="font-display text-xl">{initials(user.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="truncate font-display text-2xl font-semibold tracking-tight">
            {user.fullName || user.username || "Usuário"}
          </h2>
          <p className="truncate text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Badge className="gap-1">
                <Shield /> Administrador
              </Badge>
            )}
            {!verified && <Badge variant="outline">E-mail não verificado</Badge>}
          </div>
        </div>
        <Button asChild variant="outline" className="self-start sm:self-center">
          <Link href="/aparencia">
            <Palette /> Aparência
          </Link>
        </Button>
      </section>

      {/* Conta */}
      <dl className="grid gap-4 sm:grid-cols-3">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{f.label}</dt>
            <dd className="mt-1 truncate font-medium">{f.value}</dd>
          </div>
        ))}
      </dl>

      {/* Conquistas */}
      <section aria-labelledby="conquistas" className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="conquistas" className="font-display text-xl font-semibold tracking-tight">
            Conquistas
          </h2>
          {!loadingAchievements && (
            <p className="text-sm tabular-nums text-muted-foreground">
              <NumberFlow value={achievements.length} className="font-medium text-foreground" />{" "}
              {achievements.length === 1 ? "conquista" : "conquistas"}
            </p>
          )}
        </div>

        {loadingAchievements ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
            ))}
          </div>
        ) : achievements.length === 0 ? (
          <EmptyState
            title="Nenhuma conquista ainda"
            description="Quem vota no Rasta Awards ganha a badge da edição."
            action={
              <Button asChild variant="outline">
                <Link href="/rasta-awards">Ir para o Rasta Awards</Link>
              </Button>
            }
            className="min-h-56"
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {achievements.map((a) => {
              const year = a.achievement_type === "rasta_awards_voter" ? a.achievement_year : 2025;
              const title = `Rasta Awards ${year}`;
              return (
                <li key={a.id} className="space-y-2">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-xl border bg-muted">
                    <Image
                      src={`/awards/rasta-awards-${year}.png`}
                      alt={`Badge ${title}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="text-sm font-medium">{title}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-10" aria-busy="true" aria-label="Carregando">
      <div className="flex items-center gap-6 rounded-2xl border p-6">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
