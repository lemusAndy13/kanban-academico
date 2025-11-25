import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Tasks from "../pages/Tasks";

const getMock = vi.fn()
  // labels
  .mockResolvedValueOnce({ data: [] })
  // boards (para responsables)
  .mockResolvedValueOnce({ data: [] })
  // search
  .mockResolvedValueOnce({ data: [] });

vi.mock("../services/axiosConfig", () => ({
  default: {
    get: (...args: any[]) => getMock(...args),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("Tasks filters", () => {
  it("aplica filtros y llama a /cards/search/", async () => {
    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );
    // Esperar UI renderizada
    const applyBtn = await screen.findByRole("button", { name: /aplicar/i });
    fireEvent.click(applyBtn);
    // última llamada debe ser a /cards/search/
    const lastCall = getMock.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toMatch(/\/cards\/search\//);
  });
});

