import { getTeam, getTeamColor, getNflLogoUrl, isNflTeam } from "@/lib/constants/teams";

interface TeamLogoProps {
  slug: string;
  size?: number;
}

// NFL teams get their real logo from ESPN's CDN; everyone else (CFB) gets a
// team-colored monogram chip.
export function TeamLogo({ slug, size = 28 }: TeamLogoProps) {
  if (isNflTeam(slug)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={getNflLogoUrl(slug)}
        alt={getTeam(slug)?.name ?? slug}
        width={size}
        height={size}
        className="shrink-0 object-contain"
        loading="lazy"
      />
    );
  }

  const team = getTeam(slug);
  const letter = (team?.abbr ?? slug).charAt(0).toUpperCase();
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center font-black text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: getTeamColor(slug),
        fontSize: size * 0.45,
      }}
    >
      {letter}
    </span>
  );
}
