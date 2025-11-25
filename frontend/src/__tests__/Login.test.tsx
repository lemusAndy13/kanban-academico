import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

vi.mock("../services/axiosConfig", () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("Login page", () => {
  it("muestra pestaña de crear cuenta al pulsar 'Crear cuenta'", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    // botón para abrir registro
    const btn = screen.getByRole("button", { name: /crear cuenta/i });
    fireEvent.click(btn);
    // debería aparecer título de crear cuenta
    expect(screen.getByText(/crear cuenta/i)).toBeInTheDocument();
  });
});

