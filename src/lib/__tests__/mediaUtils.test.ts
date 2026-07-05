import { describe, expect, it } from "vitest";

import { getMediaType, getYouTubeEmbedUrl, getYouTubeVideoId } from "../mediaUtils";

describe("mediaUtils", () => {
  it("detects audio URLs by file extension", () => {
    expect(getMediaType("https://example.com/question.mp3")).toBe("audio");
    expect(getMediaType("https://example.com/question.WAV?token=abc")).toBe("audio");
    expect(getMediaType("https://example.com/question.m4a")).toBe("audio");
  });

  it("keeps existing image, video, and YouTube detection", () => {
    expect(getMediaType("https://example.com/question.jpg")).toBe("image");
    expect(getMediaType("https://example.com/question.mp4")).toBe("video");
    expect(getMediaType("https://youtu.be/dQw4w9WgXcQ")).toBe("youtube");
  });

  it("builds YouTube embed URLs for recognized links", () => {
    expect(getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(getYouTubeEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });
});
