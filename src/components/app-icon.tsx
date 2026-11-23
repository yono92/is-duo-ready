'use client';
import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Box, Compass, FileText, Leaf, Music2, Palette } from 'lucide-react';
const icons = {
  paper: FileText,
  box: Box,
  compass: Compass,
  book: BookOpen,
  leaf: Leaf,
  music: Music2,
  palette: Palette,
};
export function AppIcon({ name, src }: { name: string; src?: string | null }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const Icon = icons[name as keyof typeof icons] ?? Box;
  const local = src && /^\/api\/(?:admin\/)?app-icons\/[a-f0-9-]{36}$/.test(src);
  const image = local && src !== failedSrc;
  return (
    // A real icon is clipped by the container alone: a second, larger image radius
    // would expose the placeholder background in the corners.
    <span className={`app-icon icon-${name}${image ? ' app-icon-image' : ''}`} aria-hidden="true">
      {image ? (
        <Image
          src={src}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Icon size={24} strokeWidth={1.65} />
      )}
    </span>
  );
}
