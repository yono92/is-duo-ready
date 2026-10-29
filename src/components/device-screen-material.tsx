'use client';

import { useMemo, type RefObject } from 'react';
import { ShaderChunk, Vector2, type IUniform, type MeshBasicMaterial, type Texture } from 'three';

// Sample the full panorama across the hinge; only the image's outer edge is clamped.
const blurSampling = /* glsl */ `
uniform float duoFoldBlur;
uniform vec2 duoTexelSize;
vec4 duoBlurTap(vec2 uv, float bias) {
  return texture2D(map, clamp(uv, 0.0, 1.0), bias);
}
vec4 duoScreenSample(vec2 uv) {
  if (duoFoldBlur < 0.001) return texture2D(map, uv);
  vec2 r = duoTexelSize * duoFoldBlur;
  // Prefilter wide taps to soften detail rather than show displaced copies.
  float bias = log2(max(duoFoldBlur * 0.18, 1.0));
  vec4 color = duoBlurTap(uv, bias) * 0.25;
  color += duoBlurTap(uv + vec2(r.x, 0.0), bias) * 0.125;
  color += duoBlurTap(uv - vec2(r.x, 0.0), bias) * 0.125;
  color += duoBlurTap(uv + vec2(0.0, r.y), bias) * 0.125;
  color += duoBlurTap(uv - vec2(0.0, r.y), bias) * 0.125;
  color += duoBlurTap(uv + r, bias) * 0.0625;
  color += duoBlurTap(uv - r, bias) * 0.0625;
  color += duoBlurTap(uv + vec2(r.x, -r.y), bias) * 0.0625;
  color += duoBlurTap(uv + vec2(-r.x, r.y), bias) * 0.0625;
  return color;
}
`;

export function DeviceScreenMaterial({
  texture,
  blur,
}: {
  texture: Texture;
  blur: RefObject<IUniform<number>>;
}) {
  const texelSize = useMemo(() => {
    const image = texture.image as { width: number; height: number };
    return { value: new Vector2(1 / image.width, 1 / image.height) };
  }, [texture]);
  const compile: MeshBasicMaterial['onBeforeCompile'] = (shader) => {
    shader.uniforms['duoFoldBlur'] = blur.current;
    shader.uniforms['duoTexelSize'] = texelSize;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>', `#include <map_pars_fragment>\n${blurSampling}`)
      .replace(
        '#include <map_fragment>',
        ShaderChunk.map_fragment.replace('texture2D( map, vMapUv )', 'duoScreenSample(vMapUv)'),
      );
  };

  return (
    <meshBasicMaterial
      map={texture}
      toneMapped={false}
      onBeforeCompile={compile}
      customProgramCacheKey={() => 'duo-screen-blur-v1'}
    />
  );
}
