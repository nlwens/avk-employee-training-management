import { render, screen } from "@testing-library/react";
import { User } from "lucide-react";
import { describe, expect, it } from "vitest";

import MetricCard from "../src/components/dashboard/MetricCard";

describe("MetricCard", () => {
  it("renders the metric label and value", () => {
    render(<MetricCard label="Total employees" value={42} icon={<User />} />);

    const card = screen.getByRole("article");

    expect(card).toHaveTextContent("Total employees");
    expect(card).toHaveTextContent("42");
  });
});
