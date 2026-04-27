"use client";

import { useEffect } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          "auto-rotate"?: boolean;
          "camera-controls"?: boolean;
          "disable-zoom"?: boolean;
          "disable-pan"?: boolean;
          "interaction-prompt"?: string;
          "rotation-per-second"?: string;
          "auto-rotate-delay"?: string | number;
          "shadow-intensity"?: string | number;
          exposure?: string | number;
          "field-of-view"?: string;
          "min-camera-orbit"?: string;
          "max-camera-orbit"?: string;
          "interpolation-decay"?: string | number;
          "camera-orbit"?: string;
        },
        HTMLElement
      >;
    }
  }
}

export function HeroMark3D() {
  useEffect(() => {
    import("@google/model-viewer");
  }, []);

  return (
    <model-viewer
      src="/branding/hireon-mark.draco.glb"
      alt="hireon.agency 3D mark"
      camera-controls
      disable-zoom
      disable-pan
      interaction-prompt="none"
      camera-orbit="0deg 90deg auto"
      min-camera-orbit="-18deg 75deg auto"
      max-camera-orbit="18deg 105deg auto"
      interpolation-decay={120}
      shadow-intensity="0"
      exposure="1.1"
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "transparent",
      }}
    />
  );
}
