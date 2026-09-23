import {
  Baseball,
  Basketball,
  BoxingGlove,
  FlagCheckered,
  Football,
  FootballHelmet,
  GameController,
  Golf,
  HandFist,
  Hockey,
  PingPong,
  Racquet,
  SoccerBall,
  Stack,
  Target,
  TennisBall,
  Trophy,
  Volleyball,
  type Icon,
} from "@phosphor-icons/react";

// Chave = nome canônico da tabela `sports`. Esporte sem ícone próprio (ou
// texto fora da lista) cai no troféu.
const ICONS: Record<string, Icon> = {
  Futebol: SoccerBall,
  Futsal: SoccerBall,
  Basquete: Basketball,
  "Futebol Americano": FootballHelmet,
  Rugby: Football,
  "Tênis": TennisBall,
  "Tênis de Mesa": PingPong,
  Badminton: Racquet,
  "Vôlei": Volleyball,
  Handebol: Volleyball,
  Beisebol: Baseball,
  "Hóquei no Gelo": Hockey,
  eSports: GameController,
  Automobilismo: FlagCheckered,
  Boxe: BoxingGlove,
  MMA: HandFist,
  Dardos: Target,
  Sinuca: Target,
  Golfe: Golf,
  "Vários": Stack,
};

export function SportIcon({ name, size = 16, className }: { name?: string | null; size?: number; className?: string }) {
  const Cmp = (name && ICONS[name]) || Trophy;
  return <Cmp size={size} className={className} />;
}
