import { olympicParkVenueDestinations } from "@/data/transit";
import { internalVenueProfiles } from "@/data/internal-facilities";

function normalizeVenue(value: string) {
  return value.toLocaleLowerCase("ko-KR").replace(/[^0-9a-z가-힣]/g, "");
}

export function findTransitDestination(venue: string | null | undefined) {
  if (!venue) return undefined;
  const query = normalizeVenue(venue);
  if (!query) return undefined;

  return olympicParkVenueDestinations.find((destination) => {
    const profile = internalVenueProfiles.find((item) =>
      [item.name, ...item.aliases].some((name) => normalizeVenue(name) === normalizeVenue(destination.name)),
    );
    const names: readonly string[] = [
      destination.name,
      ...("keywords" in destination ? destination.keywords : []),
      ...(profile ? [profile.name, ...profile.aliases] : []),
    ];
    return names.some((name) => {
      const normalized = normalizeVenue(name);
      return query === normalized || query === `올림픽공원${normalized}`;
    });
  });
}
