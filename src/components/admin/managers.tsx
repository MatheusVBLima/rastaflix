"use client";

import { deleteStory, setStoryArchived } from "@/actions/storyActions";
import { deleteMusic, setMusicArchived } from "@/actions/musicActions";
import { deleteEsculacho } from "@/actions/esculachoActions";
import { deleteInimigo } from "@/actions/inimigoActions";
import { deleteClipe, setClipeArchived } from "@/actions/clipesActions";
import {
  fetchAdminClipes,
  fetchAdminHistorias,
  fetchAdminMusicas,
  fetchEsculachos,
  fetchInimigos,
} from "@/lib/queries";
import { queryKeys } from "@/lib/query-keys";
import type { Clipe, Esculacho, Inimigo, Music, Story } from "@/lib/types";
import { AdminTable } from "./AdminTable";
import {
  clipeColumns,
  esculachoColumns,
  inimigoColumns,
  musicColumns,
  storyColumns,
} from "./tables/columns";
import { StoryForm } from "./forms/StoryForm";
import { MusicForm } from "./forms/MusicForm";
import { EsculachoForm } from "./forms/EsculachoForm";
import { InimigoForm } from "./forms/InimigoForm";
import { ClipeForm } from "./forms/ClipeForm";

const storyLabel = (r: Story) => r.title;
const musicLabel = (r: Music) => r.title;
const esculachoLabel = (r: Esculacho) => r.titulo;
const inimigoLabel = (r: Inimigo) => r.nome;
const clipeLabel = (r: Clipe) => r.titulo;

const storyArchive = {
  isArchived: (r: Story) => Boolean(r.archived),
  onToggle: setStoryArchived,
};
const musicArchive = {
  isArchived: (r: Music) => Boolean(r.archived),
  onToggle: setMusicArchived,
};
const clipeArchive = {
  isArchived: (r: Clipe) => Boolean(r.archived),
  onToggle: setClipeArchived,
};

export function HistoriasAdmin() {
  return (
    <AdminTable<Story>
      queryKey={queryKeys.historias.adminList()}
      invalidateKey={queryKeys.historias.all}
      queryFn={fetchAdminHistorias}
      columns={storyColumns}
      noun={["história", "histórias"]}
      gender="f"
      getLabel={storyLabel}
      onDelete={deleteStory}
      archive={storyArchive}
      renderForm={(p) => <StoryForm {...p} />}
      storageKey="rastaflix:admin:historias"
    />
  );
}

export function MusicasAdmin() {
  return (
    <AdminTable<Music>
      queryKey={queryKeys.musicas.adminList()}
      invalidateKey={queryKeys.musicas.all}
      queryFn={fetchAdminMusicas}
      columns={musicColumns}
      noun={["música", "músicas"]}
      gender="f"
      getLabel={musicLabel}
      onDelete={deleteMusic}
      archive={musicArchive}
      renderForm={(p) => <MusicForm {...p} />}
      storageKey="rastaflix:admin:musicas"
    />
  );
}

export function EsculachosAdmin() {
  return (
    <AdminTable<Esculacho>
      queryKey={queryKeys.esculachos.list()}
      queryFn={fetchEsculachos}
      columns={esculachoColumns}
      noun={["esculacho", "esculachos"]}
      getLabel={esculachoLabel}
      onDelete={deleteEsculacho}
      renderForm={(p) => <EsculachoForm {...p} />}
      storageKey="rastaflix:admin:esculachos"
    />
  );
}

export function InimigosAdmin() {
  return (
    <AdminTable<Inimigo>
      queryKey={queryKeys.inimigos.list()}
      queryFn={fetchInimigos}
      columns={inimigoColumns}
      noun={["inimigo", "inimigos"]}
      getLabel={inimigoLabel}
      onDelete={deleteInimigo}
      renderForm={(p) => <InimigoForm {...p} />}
      storageKey="rastaflix:admin:inimigos"
    />
  );
}

export function ClipesAdmin() {
  return (
    <AdminTable<Clipe>
      queryKey={queryKeys.clipes.adminList()}
      invalidateKey={queryKeys.clipes.all}
      queryFn={fetchAdminClipes}
      columns={clipeColumns}
      noun={["clipe", "clipes"]}
      getLabel={clipeLabel}
      onDelete={deleteClipe}
      archive={clipeArchive}
      renderForm={(p) => <ClipeForm {...p} />}
      storageKey="rastaflix:admin:clipes"
    />
  );
}
