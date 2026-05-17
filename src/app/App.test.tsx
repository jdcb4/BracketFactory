import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { App } from "./App";

describe("App", () => {
  it("renders the BracketFactory wizard", () => {
    render(<App />);

    expect(screen.getByText("BracketFactory")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download stl/i }),
    ).toBeInTheDocument();
  });

  it("moves through the parameter ribbon with Next and Back", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(
      screen.getByRole("heading", { name: /choose the bracket/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(
      screen.getByRole("heading", { name: /set the envelope/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next/i }));
    expect(
      screen.getByRole("heading", { name: /select hardware/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: /mounting hardware/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /countersunk/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(
      screen.getByRole("heading", { name: /set the envelope/i }),
    ).toBeInTheDocument();
  });

  it("lets users choose an angle bracket and configure gussets after holes", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: /angle bracket/i }));
    expect(
      screen.getByText(
        "Right-angle bracket with base and upright flanges, safe holes, and gussets.",
      ),
    ).toBeInTheDocument();

    const holesStep = screen
      .getAllByRole("button", { name: /holes/i })
      .find((button) => button.textContent === "Holes");

    expect(holesStep).toBeDefined();
    await user.click(holesStep!);
    expect(screen.getByText("Base flange holes")).toBeInTheDocument();

    const gussetsStep = screen
      .getAllByRole("button", { name: /gussets/i })
      .find((button) => button.textContent === "Gussets");

    expect(gussetsStep).toBeDefined();
    await user.click(gussetsStep!);
    expect(
      screen.getByRole("heading", { name: /configure gussets/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /25% \/ 75% pair/i }),
    ).toBeEnabled();
    expect(screen.getByText("Gusset face coverage")).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: /gusset face coverage slider/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /available layouts keep ribs out of the protected hole bands/i,
      ),
    ).toBeInTheDocument();
  });
});
