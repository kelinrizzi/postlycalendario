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
        {slide.showTitle && slide.title.trim() && (
          <div
            style={{
              color: slide.textColor,
              fontSize: slide.titleSize,
              lineHeight: 1.05,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              textAlign,
              maxWidth: "100%",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              marginBottom: size * 0.025,
              textShadow: slide.overlay === "none" ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
            }}
          >
            {slide.title}
          </div>
        )}
        <div
          style={{
            color: slide.textColor,
            fontSize: slide.fontSize,
            lineHeight: 1.15,
            fontWeight: 600,
            textAlign,
            maxWidth: "100%",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            opacity: slide.showTitle && slide.title.trim() ? 0.95 : 1,
            textShadow: slide.overlay === "none" ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
          }}
        >
          {slide.text}

        </div>
      </div>
      {slide.handle.trim() && (
        <div
          style={{
            position: "absolute",
            bottom: size * 0.05,
            left: size * 0.05,
            zIndex: 2,
            color: slide.textColor,
            fontFamily: slide.fontFamily,
            fontSize: size * 0.04,
            fontWeight: 700,
            opacity: 0.92,
            textShadow: slide.overlay === "none" ? "0 2px 12px rgba(0,0,0,0.25)" : "none",
          }}
        >
          @{slide.handle.replace(/^@/, "")}
        </div>
      )}
      {slide.logoUrl && (
        <img
          src={slide.logoUrl}
          alt=""
          crossOrigin="anonymous"
          style={{
            position: "absolute",
            bottom: size * 0.05,
            right: size * 0.05,
            height: size * 0.1,
            maxWidth: size * 0.32,
            objectFit: "contain",
            zIndex: 2,
            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.25))",
          }}
        />
      )}
    </div>
  );
});
