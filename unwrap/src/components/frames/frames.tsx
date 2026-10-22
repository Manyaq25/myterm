// Çift / bestie çerçeveleri (Pro). Her çerçevede iki yuva var: 0 = sen, 1 = eşin/bestien.
// Yuva: kırpma şekli (clip) + içeriğin konacağı kare (box). under/over: süsler (200×200).
// Kimlikler sabittir; yeni çerçeve listenin sonuna eklenir.
import type { ReactNode } from 'react';
import { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';

import { heartPath, ring, rotPoint, rotRect, starPath } from './shapes';

export type FrameGroup = 'love' | 'friends';
export type Box = { x: number; y: number; s: number };
export type Slot = { clip: ReactNode; box: Box };
export type FrameDef = { id: string; group: FrameGroup; emoji: string; slots: [Slot, Slot]; under?: ReactNode; over?: ReactNode };

const circle = (cx: number, cy: number, r: number): Slot => ({ clip: <Circle cx={cx} cy={cy} r={r} />, box: { x: cx - r, y: cy - r, s: r * 2 } });
const path = (d: string, box: Box): Slot => ({ clip: <Path d={d} />, box });
const ringStroke = (cx: number, cy: number, r: number, color: string, w = 5) => <Circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={w} />;
const emoji = (x: number, y: number, e: string, size = 28) => (
  <SvgText x={x} y={y} fontSize={size} textAnchor="middle">
    {e}
  </SvgText>
);

const PINK = '#FF5C8A';
const RED = '#E63950';
const GOLD = '#F2C14E';
const WHITE = '#FFFFFF';
const INK = '#1E1B1C';

// Büyük kalp ve iki yarısı (düz ve zikzak)
const BIG_HEART = 'M100 172 C46 134 14 104 22 66 C28 38 70 28 100 62 C130 28 172 38 178 66 C186 104 154 134 100 172 Z';
const HEART_L = 'M100 62 L100 172 C46 134 14 104 22 66 C28 38 70 28 100 62 Z';
const HEART_R = 'M100 62 C130 28 172 38 178 66 C186 104 154 134 100 172 Z';
const ZIG_L = 'M100 62 L90 84 L108 104 L90 124 L106 146 L100 172 C46 134 14 104 22 66 C28 38 70 28 100 62 Z';
const ZIG_R = 'M100 62 C130 28 172 38 178 66 C186 104 154 134 100 172 L106 146 L90 124 L108 104 L90 84 Z';

// Polaroid: beyaz kart + içindeki kare fotoğraf alanı
function polaroid(cx: number, cy: number, deg: number) {
  const [px, py] = rotPoint(cx, cy, 0, -9, deg);
  return {
    card: <Path d={rotRect(cx, cy, 84, 102, deg)} fill={WHITE} stroke="#EAE2E3" strokeWidth={1.5} />,
    slot: path(rotRect(px, py, 70, 70, deg), { x: px - 40, y: py - 40, s: 80 }),
    foot: rotPoint(cx, cy, 0, 42, deg),
  };
}
const PL1 = polaroid(66, 98, -9);
const PL2 = polaroid(136, 104, 8);

// Çelenk süsleri
const roses = ring(100, 100, 80, 14).map(([x, y], i) => (
  <G key={i}>
    <Ellipse cx={x + 6} cy={y + 5} rx={7} ry={4} fill="#4E9A45" />
    <Circle cx={x} cy={y} r={8} fill={i % 3 === 2 ? '#FF8FA3' : RED} />
    <Circle cx={x} cy={y} r={3.5} fill={i % 3 === 2 ? '#E35D7A' : '#A3192F'} />
  </G>
));
const daisies = ring(100, 100, 80, 12).map(([x, y], i) => (
  <G key={i}>
    {ring(x, y, 6, 6).map(([px, py], j) => (
      <Circle key={j} cx={px} cy={py} r={4.2} fill={WHITE} stroke="#F0E6C8" strokeWidth={0.6} />
    ))}
    <Circle cx={x} cy={y} r={3.6} fill="#FFC23D" />
  </G>
));
const sparkles = [[30, 40], [170, 36], [178, 170], [24, 164], [100, 22]].map(([x, y], i) => (
  <Path key={i} d={`M${x} ${y - 8} L${x + 2} ${y - 2} L${x + 8} ${y} L${x + 2} ${y + 2} L${x} ${y + 8} L${x - 2} ${y + 2} L${x - 8} ${y} L${x - 2} ${y - 2} Z`} fill={GOLD} />
));
const crown = (x: number, y: number) => (
  <G>
    <Path d={`M${x - 22} ${y} L${x - 26} ${y - 26} L${x - 11} ${y - 13} L${x} ${y - 30} L${x + 11} ${y - 13} L${x + 26} ${y - 26} L${x + 22} ${y} Z`} fill={GOLD} stroke="#C9952B" strokeWidth={2} strokeLinejoin="round" />
    <Circle cx={x} cy={y - 8} r={3.2} fill={RED} />
    <Circle cx={x - 13} cy={y - 6} r={2.4} fill="#5B8DEF" />
    <Circle cx={x + 13} cy={y - 6} r={2.4} fill="#4CC9A0" />
  </G>
);

export const FRAMES: FrameDef[] = [
  // 💞 Aşk
  {
    id: 'rings', group: 'love', emoji: '💍',
    slots: [circle(66, 104, 50), circle(134, 104, 50)],
    over: (
      <G>
        {ringStroke(66, 104, 50, GOLD, 6)}
        {ringStroke(134, 104, 50, GOLD, 6)}
        {/* Halkaların iç içe geçtiği yer */}
        <Path d="M91 60.7 A50 50 0 0 1 107 75.3" stroke={GOLD} strokeWidth={6} fill="none" />
        <Path d="M134 24 L144 36 L134 50 L124 36 Z" fill="#CDEBFF" stroke={WHITE} strokeWidth={2} />
      </G>
    ),
  },
  {
    id: 'heart', group: 'love', emoji: '❤️',
    slots: [path(HEART_L, { x: 14, y: 46, s: 104 }), path(HEART_R, { x: 82, y: 46, s: 104 })],
    over: (
      <G>
        <Path d={BIG_HEART} fill="none" stroke={RED} strokeWidth={6} strokeLinejoin="round" />
        <Path d="M100 62 L100 172" stroke={WHITE} strokeWidth={2.5} />
      </G>
    ),
  },
  {
    id: 'twoHearts', group: 'love', emoji: '💕',
    slots: [path(heartPath(70, 92, 112), { x: 22, y: 38, s: 96 }), path(heartPath(132, 112, 104), { x: 86, y: 62, s: 92 })],
    over: (
      <G fill="none" strokeWidth={5} strokeLinejoin="round">
        <Path d={heartPath(70, 92, 112)} stroke={PINK} />
        <Path d={heartPath(132, 112, 104)} stroke={RED} />
      </G>
    ),
  },
  {
    id: 'infinity', group: 'love', emoji: '♾️',
    slots: [circle(60, 100, 38), circle(140, 100, 38)],
    over: (
      <G>
        <Path d="M100 100 C80 52 18 52 18 100 C18 148 80 148 100 100 C120 52 182 52 182 100 C182 148 120 148 100 100 Z" fill="none" stroke={PINK} strokeWidth={7} strokeLinejoin="round" />
        <Path d={heartPath(100, 100, 20)} fill={RED} />
      </G>
    ),
  },
  {
    id: 'neon', group: 'love', emoji: '💖',
    under: <Rect x={4} y={4} width={192} height={192} rx={44} fill="#1A1033" />,
    slots: [circle(70, 100, 34), circle(130, 100, 34)],
    over: (
      <G fill="none" strokeLinejoin="round">
        <Path d={BIG_HEART} stroke="#FF4FD8" strokeWidth={14} opacity={0.25} />
        <Path d={BIG_HEART} stroke="#FF8BEA" strokeWidth={4} />
        {ringStroke(70, 100, 34, '#7CF8FF', 3)}
        {ringStroke(130, 100, 34, '#7CF8FF', 3)}
        <Path d={heartPath(172, 34, 26)} stroke="#7CF8FF" strokeWidth={3} />
        <Path d={heartPath(30, 168, 20)} stroke="#FF8BEA" strokeWidth={3} />
      </G>
    ),
  },
  {
    id: 'polaroidLove', group: 'love', emoji: '📸',
    under: <G>{PL1.card}{PL2.card}</G>,
    slots: [PL1.slot, PL2.slot],
    over: (
      <G>
        <Path d={heartPath(PL1.foot[0], PL1.foot[1] - 2, 16)} fill={RED} />
        <Path d={heartPath(PL2.foot[0], PL2.foot[1] - 2, 16)} fill={PINK} />
        <Rect x={86} y={18} width={30} height={12} rx={2} fill="#FFE08A" opacity={0.85} transform="rotate(-12 101 24)" />
      </G>
    ),
  },
  {
    id: 'kiss', group: 'love', emoji: '💋',
    slots: [circle(62, 92, 46), circle(138, 92, 46)],
    over: (
      <G>
        {ringStroke(62, 92, 46, PINK, 5)}
        {ringStroke(138, 92, 46, PINK, 5)}
        {emoji(100, 172, '💋', 40)}
      </G>
    ),
  },
  {
    id: 'cupid', group: 'love', emoji: '💘',
    slots: [circle(68, 106, 44), circle(132, 98, 44)],
    over: (
      <G>
        {ringStroke(68, 106, 44, RED, 5)}
        {ringStroke(132, 98, 44, RED, 5)}
        <Path d="M22 166 L176 34" stroke="#8B5A2B" strokeWidth={4} strokeLinecap="round" />
        <Path d="M188 24 L166 32 L176 44 Z" fill={RED} />
        <Path d="M22 166 L14 158 M30 159 L22 151 M22 166 L14 174 M30 159 L22 167" stroke={PINK} strokeWidth={4} strokeLinecap="round" />
      </G>
    ),
  },
  {
    id: 'roses', group: 'love', emoji: '🌹',
    under: <Circle cx={100} cy={100} r={92} fill="#FFE4EA" />,
    slots: [circle(74, 100, 40), circle(126, 100, 40)],
    over: (
      <G>
        {ringStroke(74, 100, 40, WHITE, 3)}
        {ringStroke(126, 100, 40, WHITE, 3)}
        {roses}
      </G>
    ),
  },
  {
    id: 'moonStar', group: 'love', emoji: '🌙',
    under: <Rect x={4} y={4} width={192} height={192} rx={44} fill="#2A2B5E" />,
    slots: [circle(76, 90, 52), path(starPath(146, 136, 46, 21), { x: 108, y: 102, s: 76 })],
    over: (
      <G>
        {ringStroke(76, 90, 52, '#FFE08A', 4)}
        <Path d={starPath(146, 136, 46, 21)} fill="none" stroke="#FFE08A" strokeWidth={4} strokeLinejoin="round" />
        {sparkles}
      </G>
    ),
  },
  {
    id: 'lock', group: 'love', emoji: '🔐',
    under: (
      <G>
        <Path d="M58 92 L58 64 C58 16 142 16 142 64 L142 92" stroke="#C9C3D6" strokeWidth={14} fill="none" />
        <Rect x={24} y={86} width={152} height={104} rx={28} fill={PINK} />
      </G>
    ),
    slots: [circle(68, 136, 36), circle(132, 136, 36)],
    over: (
      <G>
        {ringStroke(68, 136, 36, WHITE, 4)}
        {ringStroke(132, 136, 36, WHITE, 4)}
        <Path d={heartPath(100, 178, 18)} fill={WHITE} />
      </G>
    ),
  },
  {
    id: 'balloons', group: 'love', emoji: '🎈',
    under: (
      <G stroke="#9C8E90" strokeWidth={2} fill="none">
        <Path d="M66 132 C70 156 90 170 100 196" />
        <Path d="M134 140 C130 162 110 174 100 196" />
      </G>
    ),
    slots: [path(heartPath(66, 82, 104), { x: 22, y: 30, s: 88 }), path(heartPath(134, 90, 100), { x: 92, y: 40, s: 84 })],
    over: (
      <G fill="none" strokeWidth={5} strokeLinejoin="round">
        <Path d={heartPath(66, 82, 104)} stroke={RED} />
        <Path d={heartPath(134, 90, 100)} stroke={PINK} />
        <Path d="M40 54 C44 46 50 42 56 42" stroke={WHITE} strokeWidth={4} strokeLinecap="round" opacity={0.8} />
      </G>
    ),
  },
  {
    id: 'crowns', group: 'love', emoji: '👑',
    slots: [circle(66, 116, 46), circle(134, 116, 46)],
    over: (
      <G>
        {ringStroke(66, 116, 46, GOLD, 5)}
        {ringStroke(134, 116, 46, GOLD, 5)}
        {crown(66, 74)}
        {crown(134, 74)}
      </G>
    ),
  },
  {
    id: 'cherries', group: 'love', emoji: '🍒',
    under: (
      <G>
        <Path d="M64 86 C70 54 90 32 108 18" stroke="#4E9A45" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M136 86 C128 58 116 34 108 18" stroke="#4E9A45" strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M108 18 C124 4 148 8 156 22 C140 30 120 28 108 18 Z" fill="#6FBF5E" />
      </G>
    ),
    slots: [circle(62, 128, 44), circle(138, 128, 44)],
    over: (
      <G>
        {ringStroke(62, 128, 44, '#D7263D', 6)}
        {ringStroke(138, 128, 44, '#D7263D', 6)}
        <Path d="M38 108 C42 100 48 96 54 94" stroke={WHITE} strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.8} />
      </G>
    ),
  },
  // 👯 Samimi arkadaşlık
  {
    id: 'bff', group: 'friends', emoji: '🫶',
    slots: [circle(66, 84, 48), circle(134, 84, 48)],
    over: (
      <G>
        {ringStroke(66, 84, 48, '#674BB5', 5)}
        {ringStroke(134, 84, 48, '#FFC857', 5)}
        <Path d="M22 146 L178 146 L170 162 L178 178 L22 178 L30 162 Z" fill="#674BB5" />
        <SvgText x={100} y={171} fontSize={26} fontWeight="bold" fill={WHITE} textAnchor="middle" letterSpacing={4}>
          BFF
        </SvgText>
      </G>
    ),
  },
  {
    id: 'puzzle', group: 'friends', emoji: '🧩',
    slots: [
      path('M12 56 L100 56 L100 84 C116 76 126 88 126 100 C126 112 116 124 100 116 L100 144 L12 144 Z', { x: 12, y: 56, s: 88 }),
      path('M100 56 L188 56 L188 144 L100 144 L100 116 C116 124 126 112 126 100 C126 88 116 76 100 84 Z', { x: 104, y: 56, s: 88 }),
    ],
    over: (
      <G fill="none" strokeLinejoin="round">
        <Path d="M12 56 L188 56 L188 144 L12 144 Z" stroke="#5B8DEF" strokeWidth={5} />
        <Path d="M100 56 L100 84 C116 76 126 88 126 100 C126 112 116 124 100 116 L100 144" stroke="#FFC857" strokeWidth={5} />
      </G>
    ),
  },
  {
    id: 'stars', group: 'friends', emoji: '⭐',
    slots: [path(starPath(62, 94, 58, 27), { x: 20, y: 54, s: 84 }), path(starPath(140, 110, 54, 25), { x: 101, y: 72, s: 78 })],
    over: (
      <G fill="none" strokeWidth={4} strokeLinejoin="round">
        <Path d={starPath(62, 94, 58, 27)} stroke={GOLD} />
        <Path d={starPath(140, 110, 54, 25)} stroke="#FF8FA3" />
      </G>
    ),
  },
  {
    id: 'daisies', group: 'friends', emoji: '🌼',
    under: <Circle cx={100} cy={100} r={92} fill="#DDF5D2" />,
    slots: [circle(74, 100, 40), circle(126, 100, 40)],
    over: (
      <G>
        {ringStroke(74, 100, 40, WHITE, 3)}
        {ringStroke(126, 100, 40, WHITE, 3)}
        {daisies}
      </G>
    ),
  },
  {
    id: 'photoBooth', group: 'friends', emoji: '🎞️',
    under: <Rect x={50} y={4} width={100} height={192} rx={10} fill={INK} />,
    slots: [
      path('M60 14 L140 14 L140 94 L60 94 Z', { x: 60, y: 14, s: 80 }),
      path('M60 102 L140 102 L140 182 L60 182 Z', { x: 60, y: 102, s: 80 }),
    ],
    over: (
      <G fill={WHITE}>
        {[20, 44, 68, 92, 116, 140, 164].map((y) => (
          <G key={y}>
            <Rect x={52.5} y={y} width={4} height={8} rx={1} />
            <Rect x={143.5} y={y} width={4} height={8} rx={1} />
          </G>
        ))}
        <SvgText x={100} y={193} fontSize={8} fontWeight="bold" textAnchor="middle" letterSpacing={2}>
          BESTIES
        </SvgText>
      </G>
    ),
  },
  {
    id: 'halfHeart', group: 'friends', emoji: '💛',
    under: (
      <G stroke="#C9B48A" strokeWidth={2} fill="none">
        <Path d="M56 40 C40 20 20 10 6 4" />
        <Path d="M144 40 C160 20 180 10 194 4" />
      </G>
    ),
    slots: [path(ZIG_L, { x: 12, y: 50, s: 100 }), path(ZIG_R, { x: 88, y: 50, s: 100 })],
    over: (
      <G fill="none" strokeLinejoin="round">
        <Path d={ZIG_L} stroke={GOLD} strokeWidth={5} />
        <Path d={ZIG_R} stroke={GOLD} strokeWidth={5} />
        <Circle cx={56} cy={42} r={4} stroke="#C9B48A" strokeWidth={2} />
        <Circle cx={144} cy={42} r={4} stroke="#C9B48A" strokeWidth={2} />
      </G>
    ),
  },
  {
    id: 'rainbow', group: 'friends', emoji: '🌈',
    under: (
      <G fill="none" strokeWidth={10}>
        {['#FF6B6B', '#FFA94D', '#FFD43B', '#69DB7C', '#4DABF7', '#9775FA'].map((c, i) => (
          <Path key={c} d={`M${10 + i * 10} 150 A${90 - i * 10} ${90 - i * 10} 0 0 1 ${190 - i * 10} 150`} stroke={c} />
        ))}
      </G>
    ),
    slots: [circle(72, 124, 34), circle(128, 124, 34)],
    over: (
      <G>
        {ringStroke(72, 124, 34, WHITE, 4)}
        {ringStroke(128, 124, 34, WHITE, 4)}
        {[[22, 160], [178, 160]].map(([x, y]) => (
          <G key={x} fill={WHITE}>
            <Circle cx={x - 12} cy={y} r={11} />
            <Circle cx={x} cy={y - 7} r={14} />
            <Circle cx={x + 12} cy={y} r={11} />
            <Rect x={x - 22} y={y} width={44} height={12} rx={6} />
          </G>
        ))}
      </G>
    ),
  },
  {
    id: 'bubbles', group: 'friends', emoji: '💬',
    slots: [
      path('M40 14 L104 14 C120 14 130 24 130 40 L130 90 C130 106 120 116 104 116 L44 116 L22 132 L28 110 C18 104 14 98 14 90 L14 40 C14 24 24 14 40 14 Z', { x: 14, y: 14, s: 108 }),
      path('M96 84 L160 84 C176 84 186 94 186 110 L186 160 C186 168 182 174 172 180 L178 198 L156 186 L96 186 C80 186 70 176 70 160 L70 110 C70 94 80 84 96 84 Z', { x: 74, y: 84, s: 108 }),
    ],
    over: (
      <G>
        <Path d="M96 84 L160 84 C176 84 186 94 186 110 L186 160 C186 168 182 174 172 180 L178 198 L156 186 L96 186 C80 186 70 176 70 160 L70 110 C70 94 80 84 96 84 Z" fill="none" stroke="#25D366" strokeWidth={4} strokeLinejoin="round" />
        <Path d="M40 14 L104 14 C120 14 130 24 130 40 L130 90 C130 106 120 116 104 116 L44 116 L22 132 L28 110 C18 104 14 98 14 90 L14 40 C14 24 24 14 40 14 Z" fill="none" stroke="#5B8DEF" strokeWidth={4} strokeLinejoin="round" />
      </G>
    ),
  },
  {
    id: 'lightning', group: 'friends', emoji: '⚡',
    slots: [circle(54, 100, 44), circle(146, 100, 44)],
    over: (
      <G>
        {ringStroke(54, 100, 44, INK, 4)}
        {ringStroke(146, 100, 44, INK, 4)}
        <Path d="M110 36 L84 106 L102 106 L88 166 L122 90 L102 90 Z" fill="#FFC857" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      </G>
    ),
  },
  {
    id: 'peas', group: 'friends', emoji: '🫛',
    under: <Path d="M8 100 C40 38 160 38 192 100 C160 162 40 162 8 100 Z" fill="#8BD17C" stroke="#4E9A45" strokeWidth={4} />,
    slots: [circle(66, 100, 38), circle(134, 100, 38)],
    over: (
      <G>
        {ringStroke(66, 100, 38, '#4E9A45', 4)}
        {ringStroke(134, 100, 38, '#4E9A45', 4)}
        <Path d="M188 96 C194 84 196 74 192 62" stroke="#4E9A45" strokeWidth={5} fill="none" strokeLinecap="round" />
      </G>
    ),
  },
];

const BY_ID = new Map(FRAMES.map((f) => [f.id, f]));
export const getFrame = (id: string) => BY_ID.get(id) ?? null;
