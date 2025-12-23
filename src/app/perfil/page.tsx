import { UserProfile } from "@/components/user/UserProfile";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meu Perfil | Rastaflix",
  description: "Visualize suas informações e atividades na Rastaflix.",
};

export default function PerfilPage() {
  return <UserProfile />;
}
