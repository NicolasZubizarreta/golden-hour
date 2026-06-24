import { describe, test, expect } from "vitest";
import { getMusicWidgetSnapshot, MUSIC_PLATFORMS } from "./musicWidget.js";

describe("Music Widget Parser (TU-003)", () => {
  test("extrait l'ID d'une URL Youtube Music valide", () => {
    const data = {
      platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC,
      url: "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
    };
    const snapshot = getMusicWidgetSnapshot(data);
    expect(snapshot).toBeDefined();
    expect(snapshot.resourceId).toBe("dQw4w9WgXcQ");
    expect(snapshot.resourceType).toBe("video");
  });

  test("extrait l'ID d'une URL Youtube classique valide", () => {
    // L'ID doit faire exactement 11 caractères selon la Regex du code source
    const data = {
      platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC,
      url: "https://www.youtube.com/watch?v=12345678901",
    };
    const snapshot = getMusicWidgetSnapshot(data);
    expect(snapshot).toBeDefined();
    expect(snapshot.resourceId).toBe("12345678901");
  });

  test("gère gracieusement une URL invalide", () => {
    const data = {
      platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC,
      url: "https://notyoutube.com/video",
    };
    // La fonction doit retourner null pour une URL invalide
    expect(getMusicWidgetSnapshot(data)).toBeNull();
  });

  test("gère gracieusement une chaîne de caractères vide", () => {
    const data = { platform: MUSIC_PLATFORMS.YOUTUBE_MUSIC, url: "" };
    expect(getMusicWidgetSnapshot(data)).toBeNull();
  });
});
