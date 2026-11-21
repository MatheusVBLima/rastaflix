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
import type { HeaderUser } from "@/lib/types";
import { ProfileSkeleton } from "./ProfileSkeleton";

interface UserProfileProps {
  isAdmin: boolean;
  initialUser?: HeaderUser | null;
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

export function UserProfile({ isAdmin, initialUser = null }: UserProfileProps) {
  const { user: clerkUser, isLoaded } = useUser();

  const profile: HeaderUser | null = isLoaded
    ? clerkUser
      ? {
          id: clerkUser.id,
          fullName: clerkUser.fullName,
          username: clerkUser.username,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          imageUrl: clerkUser.imageUrl,
          emailVerified:
            clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
              ?.verification.status === "verified",
          createdAt: clerkUser.createdAt?.toISOString() ?? null,
          lastSignInAt: clerkUser.lastSignInAt?.toISOString() ?? null,
        }
      : null
    : initialUser;

  const { data: achievements = [], isLoading: loadingAchievements } = useQuery({
    queryKey: profile?.id ? queryKeys.user.achievements(profile.id) : ["userAchievements", "pending"],
    queryFn: () => (profile?.id ? fetchUserAchievements(profile.id) : Promise.resolve([])),
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!isLoaded && initialUser === undefined) return <ProfileSkeleton />;

  if (!profile) {
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

  const facts = [
    { label: "Usuário", value: profile.username ? `@${profile.username}` : "Não definido" },
    { label: "Membro desde", value: formatDate(profile.createdAt ?? undefined) },
    {
      label: "Último acesso",
      value: profile.lastSignInAt ? formatDate(profile.lastSignInAt) : "Nunca",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Identidade */}
      <section className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center">
        <Avatar className="size-20 ring-2 ring-border">
          <AvatarImage src={profile.imageUrl} alt="" />
          <AvatarFallback className="font-display text-xl">{initials(profile.fullName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="truncate font-display text-2xl font-semibold tracking-tight">
            {profile.fullName || profile.username || "Usuário"}
          </h2>
          <p className="truncate text-muted-foreground">{profile.email}</p>
          <div className="flex flex-wrap gap-2">
            {isAdmin && (
              <Badge className="gap-1">
                <Shield /> Administrador
              </Badge>
            )}
            {!profile.emailVerified && <Badge variant="outline">E-mail não verificado</Badge>}
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
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-[3/4] w-full rounded-xl" />
                <Skeleton className="h-4 w-28" />
              </div>
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
