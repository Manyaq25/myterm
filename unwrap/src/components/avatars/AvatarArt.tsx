// Hazır karakterleri SVG ile çizer (100×100 alan). Parçalar sırayla üst üste konur:
// arka saç → boyun/gövde → başörtüsü → kulak → yüz → yüz detayları → ön saç → aksesuar.
import type { ReactNode } from 'react';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

import { getPreset, SKINS, type AvatarPreset, type HairStyle } from './presets';

/** Rengi koyulaştırır (amt 0–1) ya da eksiyle açar. */
export function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? c * (1 - amt) : c + (255 - c) * -amt)));
  const r = f((n >> 16) & 255), g = f((n >> 8) & 255), b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const INK = '#2B2024';
const GOLD = '#F2C14E';
const FACE_RX = { round: 19, oval: 17, square: 19 } as const;

// Başın arkasında kalan saç parçaları
function hairBack(style: HairStyle, c: string): ReactNode {
  switch (style) {
    case 'long':
      return <Path d="M27 46 C25 23 37 15 50 15 C63 15 75 23 73 46 C74 60 76 72 78 84 C66 88 34 88 22 84 C24 72 26 60 27 46 Z" fill={c} />;
    case 'bob':
      return <Path d="M27 50 C25 24 38 16 50 16 C62 16 75 24 73 50 C74 58 74 63 72 67 C62 69 38 69 28 67 C26 63 26 58 27 50 Z" fill={c} />;
    case 'bun':
      return <Circle cx={50} cy={16} r={9} fill={c} />;
    case 'ponytail':
      return (
        <G>
          <Path d="M64 26 C80 28 86 48 82 64 C80 72 76 78 72 82 C74 70 74 58 68 46 C66 40 64 34 62 30 Z" fill={c} />
          <Circle cx={66} cy={29} r={3} fill={shade(c, 0.3)} />
        </G>
      );
    case 'curlyLong':
      return (
        <G fill={c}>
          {[[30, 30], [26, 42], [25, 54], [27, 66], [31, 76], [70, 30], [74, 42], [75, 54], [73, 66], [69, 76], [40, 20], [50, 17], [60, 20]].map(([x, y]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={9} />
          ))}
        </G>
      );
    case 'braids':
      return (
        <G fill={c}>
          <Path d="M28 46 C26 23 38 16 50 16 C62 16 74 23 72 46 Z" />
          {[58, 65, 72, 79, 86].map((y) => (
            <G key={y}>
              <Ellipse cx={29} cy={y} rx={4.5} ry={4} />
              <Ellipse cx={71} cy={y} rx={4.5} ry={4} />
            </G>
          ))}
        </G>
      );
    case 'afro':
      return <Circle cx={50} cy={38} r={29} fill={c} />;
    default:
      return null;
  }
}

// Alnın üstünü örten saç parçaları
function hairFront(style: HairStyle, c: string): ReactNode {
  switch (style) {
    case 'short':
      return <Path d="M30 46 C28 28 38 19 51 19 C64 19 73 28 70 46 C68 38 64 33 58 31 C50 34 40 33 34 36 C32 39 31 42 30 46 Z" fill={c} />;
    case 'buzz':
      return <Path d="M31 41 C31 27 40 22 50 22 C60 22 69 27 69 41 C66 33 59 29 50 29 C41 29 34 33 31 41 Z" fill={c} opacity={0.9} />;
    case 'quiff':
      return <Path d="M30 45 C28 30 34 20 44 16 C52 12 64 13 68 20 C72 27 71 36 70 45 C67 36 62 31 54 31 C44 31 35 36 30 45 Z" fill={c} />;
    case 'side':
      return <Path d="M30 46 C27 27 40 18 53 19 C66 20 73 29 70 46 C68 37 63 30 56 28 C48 30 38 34 30 46 Z" fill={c} />;
    case 'pixie':
      return <Path d="M30 48 C26 27 40 17 53 18 C67 19 74 30 70 47 C67 37 61 30 52 30 C47 36 38 38 30 48 Z" fill={c} />;
    case 'curly':
      return (
        <G fill={c}>
          <Ellipse cx={50} cy={31} rx={19} ry={9} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI + (i * Math.PI) / 8;
            return <Circle key={i} cx={50 + Math.cos(a) * 18} cy={37 + Math.sin(a) * 15} r={7} />;
          })}
        </G>
      );
    case 'afro':
      return <Path d="M31 40 C32 28 40 24 50 24 C60 24 68 28 69 40 C64 33 57 31 50 31 C43 31 36 33 31 40 Z" fill={c} />;
    case 'long':
      return <Path d="M30 46 C29 28 39 20 50 20 C61 20 71 28 70 46 C68 36 62 29 54 28 C50 34 40 39 30 46 Z" fill={c} />;
    case 'bob':
      return <Path d="M30 42 C30 26 40 19 50 19 C60 19 70 26 70 42 C66 37 60 35 50 35 C40 35 34 37 30 42 Z" fill={c} />;
    case 'bun':
    case 'ponytail':
      return <Path d="M30 45 C29 27 39 20 50 20 C61 20 71 27 70 45 C67 34 60 28 50 28 C40 28 33 34 30 45 Z" fill={c} />;
    case 'curlyLong':
      return (
        <G fill={c}>
          {[[36, 32, 6], [44, 27, 6.5], [52, 26, 6.5], [60, 28, 6], [66, 34, 5.5], [33, 38, 5]].map(([x, y, r]) => (
            <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
          ))}
        </G>
      );
    case 'braids':
      return (
        <G fill={c}>
          <Path d="M30 46 C29 27 39 20 50 21 C50 28 40 34 30 46 Z" />
          <Path d="M70 46 C71 27 61 20 50 21 C50 28 60 34 70 46 Z" />
        </G>
      );
    default:
      return null;
  }
}

/** Tek karakterin çizimi (100×100 alanda, zeminsiz). Çerçevelerde de kullanılır. */
export function AvatarFace({ preset: p }: { preset: AvatarPreset }) {
  const skin = SKINS[p.skin] ?? SKINS[0];
  const skinShade = shade(skin, 0.12);
  const has = (a: AvatarPreset['acc'][number]) => p.acc.includes(a);
  const hijab = has('hijab');
  const acc = p.accColor ?? '#FF6B6B';
  const rx = FACE_RX[p.face];
  const brow = p.hair === 'bald' || hijab ? shade(p.hairColor, 0.1) : shade(p.hairColor, 0.25);
  const earX = [50 - rx, 50 + rx];

  return (
    <G>
      {!hijab ? hairBack(p.hair, p.hairColor) : null}
      {/* Boyun ve gövde */}
      <Rect x={44} y={60} width={12} height={15} rx={4} fill={skinShade} />
      <Path d="M17 100 C17 82 31 73 50 73 C69 73 83 82 83 100 Z" fill={p.shirt} />
      <Path d="M43 73 Q50 80 57 73 Z" fill={skinShade} />
      {hijab ? (
        <Path d="M23 50 C21 24 35 13 50 13 C65 13 79 24 77 50 C77 64 74 76 84 100 L16 100 C26 76 23 64 23 50 Z" fill={acc} />
      ) : (
        <G>
          <Circle cx={earX[0]} cy={47} r={4.5} fill={skinShade} />
          <Circle cx={earX[1]} cy={47} r={4.5} fill={skinShade} />
          {has('earrings') ? earX.map((x) => <Circle key={x} cx={x} cy={53} r={1.9} fill={GOLD} />) : null}
          {has('hoops') ? earX.map((x) => <Circle key={x} cx={x} cy={55.5} r={3.2} fill="none" stroke={GOLD} strokeWidth={1.4} />) : null}
        </G>
      )}
      {/* Yüz */}
      {p.face === 'square' ? (
        <Rect x={31} y={24} width={38} height={42} rx={13} fill={skin} />
      ) : (
        <Ellipse cx={50} cy={45} rx={rx} ry={p.face === 'oval' ? 22 : 21} fill={skin} />
      )}
      {has('freckles')
        ? [[39, 51], [41, 53], [37, 53], [61, 51], [59, 53], [63, 53]].map(([x, y]) => <Circle key={`${x}-${y}`} cx={x} cy={y} r={0.7} fill="#B5734F" />)
        : null}
      <Ellipse cx={38} cy={53} rx={3.5} ry={2} fill="#FF7A8A" opacity={0.3} />
      <Ellipse cx={62} cy={53} rx={3.5} ry={2} fill="#FF7A8A" opacity={0.3} />
      <Path d="M50 48.5 Q48.6 51.5 50.8 52" stroke={shade(skin, 0.25)} strokeWidth={1.3} strokeLinecap="round" fill="none" />
      {/* Gözler */}
      {[43, 57].map((x) => (
        <G key={x}>
          <Circle cx={x} cy={46} r={2.6} fill={INK} />
          <Circle cx={x + 0.9} cy={45.1} r={0.8} fill="#FFFFFF" />
        </G>
      ))}
      {p.lashes ? (
        <G stroke={INK} strokeWidth={1} strokeLinecap="round">
          <Path d="M40.6 44.6 L39 43.4" />
          <Path d="M59.4 44.6 L61 43.4" />
        </G>
      ) : null}
      <G stroke={brow} strokeWidth={1.8} strokeLinecap="round" fill="none">
        <Path d="M39 40.5 Q43 38.6 46.5 40.2" />
        <Path d="M53.5 40.2 Q57 38.6 61 40.5" />
      </G>
      {/* Sakal ve ağız */}
      {has('beard') || has('stubble') ? (
        <Path
          d="M31 47 C31 63 39 72 50 72 C61 72 69 63 69 47 C67 55 63 60 57 59 C54 57 46 57 43 59 C37 60 33 55 31 47 Z"
          fill={p.hairColor}
          opacity={has('stubble') ? 0.25 : 1}
        />
      ) : null}
      {p.mouth === 'grin' ? (
        <Path d="M45 55.5 Q50 62.5 55 55.5 Z" fill="#7A2E34" stroke="#7A2E34" strokeWidth={1} strokeLinejoin="round" />
      ) : (
        <Path d={p.mouth === 'smirk' ? 'M46 57 Q51 59.5 55 55.5' : 'M45.5 56 Q50 60.5 54.5 56'} stroke="#7A2E34" strokeWidth={2} strokeLinecap="round" fill="none" />
      )}
      {has('mustache') || has('beard') ? (
        <Path d="M43 54 C46 51 49 52 50 53 C51 52 54 51 57 54 C54 55 51 54.5 50 54 C49 54.5 46 55 43 54 Z" fill={shade(p.hairColor, 0.1)} />
      ) : null}
      {/* Ön saç ve başörtüsü bandı */}
      {!hijab ? hairFront(p.hair, p.hairColor) : (
        <Path d="M29 42 C30 26 40 19 50 19 C60 19 70 26 71 42 C67 31 59 25 50 25 C41 25 33 31 29 42 Z" fill={shade(acc, 0.12)} />
      )}
      {/* Gözlükler */}
      {has('glasses') ? (
        <G stroke={INK} strokeWidth={1.8} fill="#FFFFFF" fillOpacity={0.15}>
          <Rect x={36.5} y={41.5} width={12} height={9} rx={3} />
          <Rect x={51.5} y={41.5} width={12} height={9} rx={3} />
          <Path d="M48.5 45 L51.5 45" />
        </G>
      ) : null}
      {has('roundGlasses') ? (
        <G stroke={INK} strokeWidth={1.6} fill="#FFFFFF" fillOpacity={0.15}>
          <Circle cx={43} cy={46} r={6} />
          <Circle cx={57} cy={46} r={6} />
          <Path d="M49 45.5 Q50 44.5 51 45.5" fill="none" />
        </G>
      ) : null}
      {has('sunglasses') ? (
        <G>
          <Path d="M35.5 42 L48.5 42 L48 47 C47.5 51 39 51.5 37 48 Z" fill={INK} />
          <Path d="M51.5 42 L64.5 42 L63 48 C61 51.5 52.5 51 52 47 Z" fill={INK} />
          <Path d="M48.5 43.5 L51.5 43.5" stroke={INK} strokeWidth={1.6} />
          <Path d="M38.5 44 L42 44" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.6} />
          <Path d="M54.5 44 L58 44" stroke="#FFFFFF" strokeWidth={1} strokeLinecap="round" opacity={0.6} />
        </G>
      ) : null}
      {/* Baş aksesuarları */}
      {has('cap') ? (
        <G>
          <Path d="M29 38 C29 21 39 14 50 14 C61 14 71 21 71 38 C64 35 36 35 29 38 Z" fill={acc} />
          <Path d="M48 36 C58 33 76 33 85 38 C80 41 62 41 48 40 Z" fill={shade(acc, 0.2)} />
          <Circle cx={50} cy={15} r={2} fill={shade(acc, 0.2)} />
        </G>
      ) : null}
      {has('beanie') ? (
        <G>
          <Path d="M29 38 C29 20 39 13 50 13 C61 13 71 20 71 38 Z" fill={acc} />
          <Rect x={28} y={32} width={44} height={8} rx={4} fill={shade(acc, 0.18)} />
          <Circle cx={50} cy={11} r={5} fill={shade(acc, -0.4)} />
        </G>
      ) : null}
      {has('headband') ? <Path d="M30 37 C36 26 64 26 70 37" stroke={acc} strokeWidth={4} strokeLinecap="round" fill="none" /> : null}
      {has('headphones') ? (
        <G>
          <Path d="M27 46 C27 18 73 18 73 46" stroke={INK} strokeWidth={3.5} fill="none" />
          <Rect x={22.5} y={41} width={8} height={13} rx={4} fill={acc} />
          <Rect x={69.5} y={41} width={8} height={13} rx={4} fill={acc} />
        </G>
      ) : null}
      {has('flowers')
        ? [[33, 28, '#FF8FA3'], [41, 22, '#FFC857'], [50, 20, '#FF6B6B'], [59, 22, '#B79CF0'], [67, 28, '#FF8FA3']].map(([x, y, col]) => (
            <G key={String(x)}>
              <Circle cx={Number(x)} cy={Number(y)} r={3.8} fill={String(col)} />
              <Circle cx={Number(x)} cy={Number(y)} r={1.4} fill="#FFF1BF" />
            </G>
          ))
        : null}
      {has('bow') ? (
        <G fill={acc}>
          <Path d="M64 24 L56 18 L56 30 Z" />
          <Path d="M64 24 L72 18 L72 30 Z" />
          <Circle cx={64} cy={24} r={2.6} fill={shade(acc, 0.2)} />
        </G>
      ) : null}
    </G>
  );
}

/** Kimliği bilinmeyen avatar için gri kişi silüeti (çerçevedeki ikinci kişi de). */
export function Silhouette({ color = '#C9BFC0' }: { color?: string }) {
  return (
    <G fill={color}>
      <Circle cx={50} cy={42} r={17} />
      <Path d="M18 100 C18 78 32 66 50 66 C68 66 82 78 82 100 Z" />
    </G>
  );
}

/** Hazır karakteri kendi başına çizer; bg verilirse yuvarlak zemin de çizilir. */
export function AvatarArt({ id, size, bg }: { id: string; size: number; bg?: string }) {
  const preset = getPreset(id);
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      {bg ? <Circle cx={50} cy={50} r={50} fill={bg} /> : null}
      {preset ? <AvatarFace preset={preset} /> : <Silhouette />}
    </Svg>
  );
}
