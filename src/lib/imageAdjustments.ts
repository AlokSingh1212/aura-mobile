import type { ViewStyle } from "react-native";
import type { ImageAdjustments } from "@/lib/postEditState";

function norm(v: number): number {
  return Math.max(-100, Math.min(100, v)) / 100;
}

/** Overlay layers simulating IG-style adjustments (-100…+100) for live preview. */
export function buildAdjustmentOverlays(adj: ImageAdjustments): ViewStyle[] {
  const layers: ViewStyle[] = [];

  const lux = norm(adj.lux);
  if (lux !== 0) {
    layers.push({
      backgroundColor: lux > 0 ? `rgba(255,255,255,${lux * 0.12})` : `rgba(0,0,0,${-lux * 0.1})`,
    });
  }

  const brightness = norm(adj.brightness);
  if (brightness !== 0) {
    layers.push({
      backgroundColor:
        brightness > 0 ? `rgba(255,255,255,${brightness * 0.28})` : `rgba(0,0,0,${-brightness * 0.32})`,
    });
  }

  const contrast = norm(adj.contrast);
  if (contrast !== 0) {
    layers.push({
      backgroundColor: contrast > 0 ? `rgba(0,0,0,${contrast * 0.08})` : `rgba(128,128,128,${-contrast * 0.1})`,
    });
  }

  const warmth = norm(adj.warmth);
  if (warmth !== 0) {
    layers.push({
      backgroundColor:
        warmth > 0 ? `rgba(255,160,60,${warmth * 0.22})` : `rgba(60,140,255,${-warmth * 0.18})`,
    });
  }

  const saturation = norm(adj.saturation);
  if (saturation < 0) {
    layers.push({ backgroundColor: `rgba(128,128,128,${-saturation * 0.35})` });
  } else if (saturation > 0) {
    layers.push({ backgroundColor: `rgba(255,100,100,${saturation * 0.06})` });
    layers.push({ backgroundColor: `rgba(100,200,255,${saturation * 0.06})` });
  }

  const color = norm(adj.color);
  if (color !== 0) {
    layers.push({
      backgroundColor: color > 0 ? `rgba(0,200,255,${color * 0.12})` : `rgba(255,80,180,${-color * 0.1})`,
    });
  }

  const fade = norm(adj.fade);
  if (fade > 0) {
    layers.push({ backgroundColor: `rgba(240,240,235,${fade * 0.35})` });
  }

  const highlights = norm(adj.highlights);
  if (highlights !== 0) {
    layers.push({
      backgroundColor:
        highlights > 0 ? `rgba(255,255,255,${highlights * 0.15})` : `rgba(0,0,0,${-highlights * 0.12})`,
    });
  }

  const shadows = norm(adj.shadows);
  if (shadows !== 0) {
    layers.push({
      backgroundColor: shadows > 0 ? `rgba(255,255,255,${shadows * 0.1})` : `rgba(0,0,0,${-shadows * 0.2})`,
    });
  }

  const structure = norm(adj.structure);
  if (structure !== 0) {
    layers.push({
      backgroundColor: structure > 0 ? `rgba(0,0,0,${structure * 0.06})` : `rgba(255,255,255,${-structure * 0.05})`,
    });
  }

  const vignette = norm(adj.vignette);
  if (vignette !== 0) {
    layers.push({
      backgroundColor: vignette > 0 ? `rgba(0,0,0,${vignette * 0.35})` : `rgba(255,255,255,${-vignette * 0.15})`,
    });
  }

  const tiltShift = norm(adj.tiltShift);
  if (tiltShift !== 0) {
    layers.push({
      backgroundColor: `rgba(255,255,255,${Math.abs(tiltShift) * 0.08})`,
      opacity: 0.5,
    });
  }

  const sharpness = norm(adj.sharpness);
  if (sharpness !== 0) {
    layers.push({
      backgroundColor: sharpness > 0 ? `rgba(0,0,0,${sharpness * 0.04})` : `rgba(255,255,255,${-sharpness * 0.04})`,
    });
  }

  return layers;
}
