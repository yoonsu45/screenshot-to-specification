import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import posters from "@/data/official-posters.json";
import { OfficialPosterImage } from "@/components/app/OfficialPosterImage";

it("shows only the matched official poster and handles image failure", () => {
  const poster = posters.matches[0]!;
  render(<OfficialPosterImage eventId={poster.eventId} title="공연" className="" />);
  const image = screen.getByRole("img", { name: "공연 공식 포스터" });
  expect(image).toHaveAttribute("src", poster.imageUrl);
  fireEvent.error(image);
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  expect(screen.getByText("포스터 확인 불가")).toBeInTheDocument();
});
