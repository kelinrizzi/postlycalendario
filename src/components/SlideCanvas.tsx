import type { Slide } from "@/lib/slide-types";
import { forwardRef } from "react";

type Props = {
  slide: Slide;
  size?: number;
};

const overlayBg = (kind: Slide["overlay"]) => {
  switch (kind) {
    case "dark":
      return "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)";
    case "light":
      return "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.65) 100%)";
    case "gradient":
      return "linear-gradient(135deg, rgba(214,41,118,0.55) 0%, rgba(79,91,213,0.55) 100%)";
    default:
      return "transparent";
  }
};

export const SlideCanvas = forwardRef<HTMLDivElement, Props>(function SlideCanvas(
  { slide, size = 1080 },
  ref,
) {
  const justify =
    slide.vpos === "top" ? "flex-start" : slide.vpos === "bottom" ? "flex-end" : "center";
  const align =
    slide.align === "left" ? "flex-start" : slide.align === "right" ? "flex-end" : "center";
  const textAlign = slide.align;

  return (
    <div
      ref={ref}
      style={{
        width: size,
        height: size,
        position: "relative",
        background: slide.imageUrl ? "#000" : slide.bgColor,
        overflow: "hidden",
        fontFamily: slide.fontFamily,
      }}
    >
      {slide.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={slide.imageUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: overlayBg(slide.overlay),
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: justify,
          alignItems: align,
          padding: size * 0.08,
        }}
      >
        <div
          style={{
            color: slide.textColor,
            fontSize: slide.fontSize,
            lineHeight: 1.15,
            fontWeight: 700,
            textAlign,
            maxWidth: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            textShadow: slide.overlay === "none" ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
          }}
        >
          {slide.text}
        </div>
      </div>
    </div>
  );
});
