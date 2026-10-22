// Çerçeveyi iki kişiyle çizer: her yuva kendi şekline kırpılır (ClipPath),
// içine fotoğraf, hazır karakter, emoji ya da boş silüet konur.
import { useId } from 'react';
import Svg, { ClipPath, Defs, G, Image as SvgImage, Rect, Text as SvgText } from 'react-native-svg';

import { AvatarFace, Silhouette } from '@/components/avatars/AvatarArt';
import { getPreset } from '@/components/avatars/presets';

import { getFrame, type Box } from './frames';

/** Yuvaya konacak içerik (renk = zemin). */
export type SlotContent =
  | { type: 'photo'; uri: string; color: string }
  | { type: 'preset'; id: string; color: string }
  | { type: 'emoji'; emoji: string; color: string }
  | { type: 'silhouette'; color: string };

function Content({ c, box }: { c: SlotContent; box: Box }) {
  const k = box.s / 100;
  const place = `translate(${box.x} ${box.y}) scale(${k})`;
  const preset = c.type === 'preset' ? getPreset(c.id) : null;
  return (
    <G>
      <Rect x={0} y={0} width={200} height={200} fill={c.color} />
      {c.type === 'photo' ? (
        <SvgImage href={{ uri: c.uri }} x={box.x} y={box.y} width={box.s} height={box.s} preserveAspectRatio="xMidYMid slice" />
      ) : c.type === 'emoji' ? (
        <SvgText x={box.x + box.s / 2} y={box.y + box.s * 0.68} fontSize={box.s * 0.5} textAnchor="middle">
          {c.emoji}
        </SvgText>
      ) : (
        <G transform={place}>{preset ? <AvatarFace preset={preset} /> : <Silhouette />}</G>
      )}
    </G>
  );
}

export function FrameArt({ id, size, self, partner }: { id: string; size: number; self: SlotContent; partner: SlotContent }) {
  // Aynı ekranda birden çok çerçeve olabilir: kırpma kimlikleri tekil olmalı.
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const frame = getFrame(id);
  if (!frame) return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        {frame.slots.map((s, i) => (
          <ClipPath key={i} id={`fr${uid}s${i}`}>
            {s.clip}
          </ClipPath>
        ))}
      </Defs>
      {frame.under}
      {frame.slots.map((s, i) => (
        <G key={i} clipPath={`url(#fr${uid}s${i})`}>
          <Content c={i === 0 ? self : partner} box={s.box} />
        </G>
      ))}
      {frame.over}
    </Svg>
  );
}
