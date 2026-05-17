import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: vi.fn(() => ({
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    stroke: vi.fn(),
    set fillStyle(_value: string) {},
    set globalAlpha(_value: number) {},
    set lineWidth(_value: number) {},
    set strokeStyle(_value: string) {}
  }))
});
