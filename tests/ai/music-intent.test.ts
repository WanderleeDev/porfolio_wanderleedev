import { describe, expect, test } from "bun:test";
import { isMusicRequest } from "../../src/ai/music-intent";

describe("isMusicRequest", () => {
  test("reconoce los pedidos de música en español", () => {
    expect(isMusicRequest("poneme música")).toBe(true);
    expect(isMusicRequest("poné algo para programar")).toBe(true);
    expect(isMusicRequest("qué temas tenés")).toBe(true);
    expect(isMusicRequest("pausá la música")).toBe(true);
    expect(isMusicRequest("saltá a la siguiente")).toBe(true);
  });

  test("reconoce los pedidos de música en inglés", () => {
    expect(isMusicRequest("play some music")).toBe(true);
    expect(isMusicRequest("next track")).toBe(true);
  });

  test("no se dispara con preguntas del portfolio ni con texto vacío", () => {
    expect(isMusicRequest("¿Qué proyectos tenés?")).toBe(false);
    expect(isMusicRequest("contame del stack")).toBe(false);
    expect(isMusicRequest("")).toBe(false);
  });
});