import { useEffect, useRef } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const toasterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = toasterRef.current;
    if (!container) return;
    let gesture: { element: HTMLElement; id: number; x: number; y: number; distance: number } | null = null;

    const start = (event: TouchEvent) => {
      if (event.touches.length !== 1 || !(event.target instanceof Element) || event.target.closest("button, a")) return;
      const element = event.target.closest<HTMLElement>('[data-sonner-toast][data-dismissible="true"]');
      const touch = event.touches[0];
      if (element && touch) gesture = { element, id: touch.identifier, x: touch.clientX, y: touch.clientY, distance: 0 };
    };
    const move = (event: TouchEvent) => {
      if (!gesture) return;
      const touch = Array.from(event.touches).find((item) => item.identifier === gesture?.id);
      if (!touch) return;
      const vertical = gesture.y - touch.clientY;
      if (vertical > 8 && vertical > Math.abs(touch.clientX - gesture.x)) {
        gesture.distance = vertical;
        if (event.cancelable) event.preventDefault();
      } else {
        gesture.distance = 0;
      }
    };
    const end = () => {
      if (gesture && gesture.distance >= 35) {
        gesture.element.querySelector<HTMLButtonElement>("[data-close-button]")?.click();
      }
      gesture = null;
    };
    const cancel = () => { gesture = null; };
    container.addEventListener("touchstart", start, { passive: true });
    container.addEventListener("touchmove", move, { passive: false });
    container.addEventListener("touchend", end);
    container.addEventListener("touchcancel", cancel);
    return () => {
      container.removeEventListener("touchstart", start);
      container.removeEventListener("touchmove", move);
      container.removeEventListener("touchend", end);
      container.removeEventListener("touchcancel", cancel);
    };
  }, []);

  return (
    <Sonner
      ref={toasterRef}
      closeButton
      className="toaster group"
      toastOptions={{
        closeButtonAriaLabel: "알림 닫기",
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
