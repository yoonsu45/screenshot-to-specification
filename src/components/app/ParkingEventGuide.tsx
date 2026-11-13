import { CalendarDays, Info } from "lucide-react";
import { formatDate } from "@/lib/event-service";
import { getParkingEventNotices, toKoreaDateKey } from "@/lib/parking-guidance";

type Props = {
  anchor: string;
  aliases: string[];
};

export function ParkingEventGuide({ anchor, aliases }: Props) {
  const notices = getParkingEventNotices(anchor, aliases, toKoreaDateKey(new Date()));
  const hasTodayEvent = notices.some((notice) => notice.isActiveToday);
  const hasTomorrowEvent = notices.some(
    (notice) => !notice.isActiveToday && notice.daysUntil === 1,
  );

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-start gap-3 border-b border-border px-4 py-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lime text-lime-foreground">
          <CalendarDays className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-extrabold text-primary">시연용 행사 일정 참고</h2>
            <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">
              실시간 현황 아님
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            가상 행사로 주차 안내 화면을 시연합니다. 실제 행사나 혼잡 예측 정보가 아닙니다.
          </p>
        </div>
      </div>

      <div className="px-4 py-4">
        {hasTodayEvent && (
          <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
            시연 예시: 오늘 행사가 있을 때 표시되는 주차 혼잡 안내입니다.
          </p>
        )}
        {!hasTodayEvent && hasTomorrowEvent && (
          <p className="mb-3 rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-900">
            시연 예시: 내일 행사가 있을 때 표시되는 사전 안내입니다.
          </p>
        )}

        {notices.length > 0 ? (
          <ul className="space-y-2">
            {notices.map(({ event, daysUntil, isActiveToday }) => (
              <li key={event.id} className="rounded-xl bg-secondary/70 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-extrabold text-primary">{event.title}</p>
                  <span className="shrink-0 text-xs font-bold text-brand-orange">
                    {isActiveToday
                      ? "오늘"
                      : daysUntil === 1
                        ? "내일"
                        : formatDate(event.startDate)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{event.venue}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-muted-foreground">
            앞으로 14일 안에 앱에 등록된 가까운 행사 일정이 없어요.
          </p>
        )}

        <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>실시간 주차면 수가 아닌 행사 일정 기반 참고 정보예요.</p>
        </div>
      </div>
    </section>
  );
}
