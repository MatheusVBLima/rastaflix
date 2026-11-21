"use client";

import { useRef, useState, useTransition, type KeyboardEvent, type Ref } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import NumberFlow from "@number-flow/react";
import { toast } from "sonner";
import { Award, Check, ExternalLink, Lock, Trophy } from "lucide-react";
import { useRovingRadio } from "@/hooks/use-roving-radio";
import {
  fetchActiveSeason,
  fetchVotingData,
  fetchUserVotes,
  fetchAllCategoriesWithResults,
} from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import { submitVote } from "@/actions/awardActions";
import type {
  AwardNominee,
  AwardSeason,
  AwardVote,
  CategoryWithResults,
  VotingData,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLoader } from "@/components/ui/loader";
import { RastaAwardsSkeleton } from "./RastaAwardsSkeleton";
import { LoginDialog } from "./LoginDialog";
import { celebrate } from "@/lib/celebrate";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<AwardSeason["status"], string> = {
  active: "Votação aberta",
  closed: "Votação encerrada",
  draft: "Rascunho",
};

export function RastaAwardsVoting({
  initialUserId = null,
}: {
  initialUserId?: string | null;
}) {
  const { userId: clerkUserId, isLoaded } = useAuth();
  const userId = isLoaded ? (clerkUserId ?? null) : initialUserId;
  const [, startTransition] = useTransition();
  const [votingCategoryId, setVotingCategoryId] = useState<string | null>(null);
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const queryClient = useQueryClient();
  const celebrated = useRef(false);

  const { data: activeSeason, isPending: isSeasonPending } = useQuery<AwardSeason | null>({
    queryKey: queryKeys.rastaAwards.activeSeason(),
    queryFn: fetchActiveSeason,
  });

  const { data: votingData, isPending: isVotingPending } = useQuery<VotingData | null>({
    queryKey: activeSeason
      ? queryKeys.rastaAwards.votingData(activeSeason.id)
      : ["votingData", "pending"],
    queryFn: () => (activeSeason ? fetchVotingData(activeSeason.id) : null),
    enabled: !!activeSeason,
  });

  const { data: userVotes = [] } = useQuery<AwardVote[]>({
    queryKey:
      userId && activeSeason
        ? queryKeys.rastaAwards.userVotes(userId, activeSeason.id)
        : ["userVotes", "pending"],
    queryFn: () =>
      userId && activeSeason ? fetchUserVotes(userId, activeSeason.id) : [],
    enabled: !!userId && !!activeSeason,
  });

  const { data: resultsData } = useQuery<CategoryWithResults[]>({
    queryKey: activeSeason
      ? queryKeys.rastaAwards.results(activeSeason.id)
      : ["awardsResults", "pending"],
    queryFn: () =>
      activeSeason
        ? fetchAllCategoriesWithResults(activeSeason.id)
        : Promise.resolve([]),
    enabled: !!activeSeason && activeSeason.status === "closed",
    staleTime: 5 * 60 * 1000,
  });

  const totalCategories = votingData?.categories.length ?? 0;
  const votedCount = userVotes.length;

  async function handleVote(categoryId: string, nomineeId: string) {
    if (!userId) {
      setShowLoginDialog(true);
      return;
    }
    if (!activeSeason) {
      toast.error("Nenhuma temporada ativa");
      return;
    }
    const votesKey = queryKeys.rastaAwards.userVotes(userId, activeSeason.id);
    const previousVotes = queryClient.getQueryData<AwardVote[]>(votesKey) ?? userVotes;
    const alreadyVotedHere = previousVotes.some((v) => v.category_id === categoryId);

    const optimisticVotes: AwardVote[] = alreadyVotedHere
      ? previousVotes.map((v) =>
          v.category_id === categoryId ? { ...v, nominee_id: nomineeId } : v
        )
      : [
          ...previousVotes,
          {
            id: `optimistic-${categoryId}`,
            user_id: userId,
            season_id: activeSeason.id,
            category_id: categoryId,
            nominee_id: nomineeId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];

    queryClient.setQueryData<AwardVote[]>(votesKey, optimisticVotes);
    setVotingCategoryId(categoryId);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("category_id", categoryId);
      formData.append("nominee_id", nomineeId);
      formData.append("season_id", activeSeason.id);

      const result = await submitVote(formData);

      if (result.success) {
        toast.success(result.message);
        await queryClient.invalidateQueries({ queryKey: votesKey });
        // Último voto que faltava: comemora uma vez.
        if (
          !alreadyVotedHere &&
          previousVotes.length + 1 === totalCategories &&
          !celebrated.current
        ) {
          celebrated.current = true;
          void celebrate();
        }
      } else {
        queryClient.setQueryData<AwardVote[]>(votesKey, previousVotes);
        toast.error(result.message);
      }
      setVotingCategoryId(null);
    });
  }

  function getUserVoteForCategory(categoryId: string): string | null {
    return userVotes.find((v) => v.category_id === categoryId)?.nominee_id ?? null;
  }

  if (isSeasonPending) return <RastaAwardsSkeleton />;

  if (!activeSeason) {
    return (
      <EmptyState
        icon={Award}
        title="Nenhuma votação aberta"
        description="Quando a próxima edição do Rasta Awards começar, a votação aparece aqui."
      />
    );
  }

  if (isVotingPending || !votingData) return <RastaAwardsSkeleton />;

  const isActive = activeSeason.status === "active";
  const isClosed = activeSeason.status === "closed";
  const { season } = votingData;
  // Se a temporada se chama só "Rasta Awards", o título repetiria o da página:
  // aí a descrição (ex.: "Nova Era 52") vira o título do bloco.
  const repeatsPageTitle = season.title.trim().toLowerCase() === "rasta awards";
  const seasonHeading = repeatsPageTitle && season.description ? season.description : season.title;
  const seasonDescription = seasonHeading === season.description ? null : season.description;

  return (
    <div className="space-y-8">
      {/* Temporada */}
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant={isActive ? "default" : isClosed ? "secondary" : "outline"}>
            {STATUS_LABEL[season.status]}
          </Badge>
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {seasonHeading}
          </h2>
          {seasonDescription && (
            <p className="max-w-prose text-sm text-muted-foreground">
              {seasonDescription}
            </p>
          )}
          <p className="text-sm tabular-nums text-muted-foreground">
            {formatDate(season.start_date)} a {formatDate(season.end_date)}
          </p>
        </div>

        {isActive && userId && totalCategories > 0 && (
          <div className="min-w-48 space-y-2">
            <p className="text-sm text-muted-foreground">
              <NumberFlow value={votedCount} className="font-display text-2xl font-semibold text-foreground" />
              <span className="text-foreground"> / {totalCategories}</span> categorias votadas
            </p>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out"
                style={{ width: `${(votedCount / totalCategories) * 100}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {!userId && isActive && (
        <div className="flex flex-col gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center">
          <Lock className="size-4 shrink-0 text-primary" aria-hidden />
          <p className="flex-1 text-sm">Entre na sua conta para votar.</p>
          <Button asChild size="sm" className="w-fit">
            <Link href="/sign-in">Entrar</Link>
          </Button>
        </div>
      )}

      {/* Categorias */}
      <div className="space-y-6">
        {isClosed && resultsData
          ? resultsData.map((category) => (
              <ResultsCategory key={category.id} category={category} />
            ))
          : votingData.categories.map((category) => {
              const userVote = getUserVoteForCategory(category.id);
              const isVoting = votingCategoryId === category.id;
              const disabled = !isActive || isVoting;

              return (
                <section
                  key={category.id}
                  aria-labelledby={`cat-${category.id}`}
                  className="space-y-4 rounded-xl border bg-card p-5 sm:p-6"
                >
                  <header className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h3 id={`cat-${category.id}`} className="text-lg font-semibold">
                        {category.name}
                      </h3>
                      {category.description && (
                        <p className="text-sm text-muted-foreground">
                          {category.description}
                        </p>
                      )}
                    </div>
                    {isVoting ? (
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ButtonLoader label="Registrando voto" />
                        Registrando
                      </span>
                    ) : (
                      userVote && (
                        <Badge variant="outline" className="shrink-0 gap-1 border-primary/40 text-primary">
                          <Check aria-hidden /> Votado
                        </Badge>
                      )
                    )}
                  </header>

                  <NomineeRadioGroup
                    categoryId={category.id}
                    nominees={category.nominees}
                    selectedNomineeId={userVote}
                    disabled={disabled}
                    onSelect={(nomineeId) => handleVote(category.id, nomineeId)}
                  />
                </section>
              );
            })}
      </div>

      <LoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
    </div>
  );
}

function NomineeRadioGroup({
  categoryId,
  nominees,
  selectedNomineeId,
  disabled,
  onSelect,
}: {
  categoryId: string;
  nominees: AwardNominee[];
  selectedNomineeId: string | null;
  disabled: boolean;
  onSelect: (nomineeId: string) => void;
}) {
  const radio = useRovingRadio({
    count: nominees.length,
    activeIndex: nominees.findIndex((n) => n.id === selectedNomineeId),
    disabled,
  });

  return (
    <div
      role="radiogroup"
      aria-labelledby={`cat-${categoryId}`}
      className="grid gap-3 sm:grid-cols-2"
    >
      {nominees.map((nominee, index) => {
        const { ref, tabIndex, onKeyDown } = radio.getItemProps(index);
        return (
          <NomineeOption
            key={nominee.id}
            buttonRef={ref}
            tabIndex={tabIndex}
            onKeyDown={onKeyDown}
            nominee={nominee}
            selected={selectedNomineeId === nominee.id}
            disabled={disabled}
            onSelect={() => onSelect(nominee.id)}
          />
        );
      })}
    </div>
  );
}

function NomineeOption({
  buttonRef,
  tabIndex,
  onKeyDown,
  nominee,
  selected,
  disabled,
  onSelect,
}: {
  buttonRef: Ref<HTMLButtonElement>;
  tabIndex: number;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  nominee: AwardNominee;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "group relative flex gap-3 rounded-lg border p-3 transition-[border-color,background-color,box-shadow]",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "hover:border-foreground/20 hover:bg-accent/40",
        disabled && !selected && "opacity-60"
      )}
    >
      {nominee.image_url ? (
        <div className="relative size-16 shrink-0 overflow-hidden rounded-md bg-muted">
          <Image src={nominee.image_url} alt="" fill className="object-cover" sizes="64px" unoptimized />
        </div>
      ) : null}
      <div className="min-w-0 flex-1 space-y-1">
        <button
          ref={buttonRef}
          type="button"
          role="radio"
          aria-checked={selected}
          tabIndex={tabIndex}
          onKeyDown={onKeyDown}
          disabled={disabled}
          onClick={onSelect}
          className="text-left font-medium leading-snug outline-none after:absolute after:inset-0 after:rounded-lg after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring disabled:cursor-not-allowed"
        >
          {nominee.title}
        </button>
        {nominee.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{nominee.description}</p>
        )}
        {nominee.content_link && (
          <a
            href={nominee.content_link}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver conteúdo <ExternalLink className="size-3" aria-hidden />
          </a>
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
    </div>
  );
}

export function ResultsCategory({ category }: { category: CategoryWithResults }) {
  const nominees = [...category.nominees].sort(
    (a, b) => (b.vote_count || 0) - (a.vote_count || 0)
  );
  const maxVotes = nominees[0]?.vote_count || 0;

  return (
    <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
      <header className="flex items-baseline justify-between gap-4">
        <h3 className="text-lg font-semibold">{category.name}</h3>
        <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
          <NumberFlow value={category.total_votes} /> votos
        </p>
      </header>

      <ol className="space-y-3">
        {nominees.map((nominee) => {
          const votes = nominee.vote_count || 0;
          const pct = nominee.percentage || 0;
          const isWinner = votes === maxVotes && maxVotes > 0;
          return (
            <li key={nominee.id} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className={cn("flex items-center gap-2", isWinner ? "font-semibold" : "text-muted-foreground")}>
                  {isWinner && (
                    <>
                      <Trophy className="size-4 text-primary" aria-hidden />
                      <span className="sr-only">Vencedor: </span>
                    </>
                  )}
                  {nominee.title}
                </span>
                <span className="shrink-0 text-sm tabular-nums">
                  <NumberFlow
                    value={pct}
                    format={{ maximumFractionDigits: 1 }}
                    suffix="%"
                    className={isWinner ? "font-semibold" : "text-muted-foreground"}
                  />
                  <span className="ml-2 text-xs text-muted-foreground">
                    <NumberFlow value={votes} /> votos
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-700 ease-out",
                    isWinner ? "bg-primary" : "bg-muted-foreground/40"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
