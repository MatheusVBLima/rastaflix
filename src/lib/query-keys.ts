export const queryKeys = {
  historias: {
    all: ["historias"] as const,
    list: () => ["historias"] as const,
    detail: (id: string) => ["story", id] as const,
  },
  musicas: {
    all: ["musicas"] as const,
    list: () => ["musicas"] as const,
    detail: (id: string) => ["music", id] as const,
  },
  esculachos: {
    all: ["esculachos"] as const,
    list: () => ["esculachos"] as const,
  },
  inimigos: {
    all: ["inimigos"] as const,
    list: () => ["inimigos"] as const,
  },
  clipes: {
    all: ["clipes"] as const,
    list: () => ["clipes"] as const,
  },
  rastaAwards: {
    all: ["rastaAwards"] as const,
    activeSeason: () => ["activeSeason"] as const,
    votingData: (seasonId: string) => ["votingData", seasonId] as const,
    userVotes: (userId: string, seasonId: string) =>
      ["userVotes", userId, seasonId] as const,
    results: (seasonId: string) => ["awardsResults", seasonId] as const,
    seasons: () => ["seasons"] as const,
  },
  auth: {
    adminStatus: () => ["userAdminStatus"] as const,
  },
  user: {
    achievements: (userId: string) => ["userAchievements", userId] as const,
  },
  liveStatus: {
    all: () => ["liveStatus"] as const,
  },
} as const;
