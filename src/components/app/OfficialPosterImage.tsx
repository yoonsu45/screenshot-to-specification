import { useState } from "react";
import { Music2 } from "lucide-react";
import { getOfficialPoster } from "@/lib/official-posters";

export function OfficialPosterImage({
  eventId,
  title,
  className,
}: {
  eventId: string;
  title: string;
  className: string;
}) {
  const poster = getOfficialPoster(eventId);
  const [failed, setFailed] = useState(false);
  return poster && !failed ? (
    <img
      src={poster.imageUrl}
      alt={`${title} 공식 포스터`}
      loading="lazy"
      className={`${className} object-contain bg-secondary`}
      onError={() => setFailed(true)}
    />
  ) : (
    <span
      className={`${className} flex flex-col items-center justify-center gap-2 bg-secondary text-primary`}
    >
      <Music2 className="h-10 w-10" />
      <span className="text-xs font-bold">{failed ? "포스터 확인 불가" : "공식 공연정보"}</span>
    </span>
  );
}
