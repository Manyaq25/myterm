// Hazır karakter avatarları: her biri yüz + ten + saç + saç rengi + aksesuardan oluşur.
// Kimlik ('f01' gibi) sabittir; sunucuya yalnız bu kimlik gider. Silme, sıra değiştirme yok,
// yeni karakter listenin sonuna eklenir.

export type FaceShape = 'round' | 'oval' | 'square';
export type HairStyle =
  | 'short' | 'buzz' | 'quiff' | 'side' | 'curly' | 'afro' | 'pixie'
  | 'long' | 'bob' | 'bun' | 'ponytail' | 'curlyLong' | 'braids' | 'bald';
export type Accessory =
  | 'glasses' | 'roundGlasses' | 'sunglasses' | 'cap' | 'beanie' | 'headphones'
  | 'earrings' | 'hoops' | 'beard' | 'mustache' | 'stubble' | 'hijab'
  | 'flowers' | 'bow' | 'headband' | 'freckles';
export type Mouth = 'smile' | 'grin' | 'smirk';
export type PresetGender = 'f' | 'm' | 'n';

export type AvatarPreset = {
  id: string;
  gender: PresetGender;
  face: FaceShape;
  skin: number; // SKINS sırası
  hair: HairStyle;
  hairColor: string;
  shirt: string;
  acc: Accessory[];
  accColor?: string; // şapka, başörtüsü, kulaklık rengi
  mouth?: Mouth;
  lashes?: boolean;
};

// Açıktan koyuya ten renkleri
export const SKINS = ['#FFE0C7', '#F7CBA4', '#EAB38A', '#D29A6B', '#A86C46', '#74472C'];

export const HAIR = {
  black: '#2B2024',
  dark: '#4A3228',
  brown: '#7B4B2A',
  auburn: '#A0412D',
  ginger: '#D06A2C',
  blonde: '#E8C170',
  platinum: '#EFE4CF',
  gray: '#B8B2AE',
  pink: '#F28DB2',
  lilac: '#A88BEB',
  blue: '#5B8DEF',
  mint: '#4CC9A0',
} as const;

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Kadın
  { id: 'f01', gender: 'f', face: 'oval', skin: 0, hair: 'long', hairColor: HAIR.brown, shirt: '#FF8FA3', acc: ['earrings'], lashes: true },
  { id: 'f02', gender: 'f', face: 'round', skin: 3, hair: 'bun', hairColor: HAIR.black, shirt: '#674BB5', acc: ['roundGlasses'], lashes: true },
  { id: 'f03', gender: 'f', face: 'oval', skin: 1, hair: 'bald', hairColor: HAIR.dark, shirt: '#F5B7C5', acc: ['hijab'], accColor: '#B79CF0', lashes: true },
  { id: 'f04', gender: 'f', face: 'round', skin: 4, hair: 'curlyLong', hairColor: HAIR.black, shirt: '#FFC857', acc: ['hoops'], mouth: 'grin', lashes: true },
  { id: 'f05', gender: 'f', face: 'round', skin: 0, hair: 'bob', hairColor: HAIR.blonde, shirt: '#6FCF97', acc: ['freckles', 'bow'], accColor: '#FF6B6B', lashes: true },
  { id: 'f06', gender: 'f', face: 'oval', skin: 2, hair: 'ponytail', hairColor: HAIR.auburn, shirt: '#5B8DEF', acc: ['headphones'], accColor: '#FF6B6B', mouth: 'grin', lashes: true },
  { id: 'f07', gender: 'f', face: 'oval', skin: 5, hair: 'braids', hairColor: HAIR.black, shirt: '#FF6B6B', acc: ['earrings'], lashes: true },
  { id: 'f08', gender: 'f', face: 'round', skin: 2, hair: 'pixie', hairColor: HAIR.pink, shirt: '#1E1B1C', acc: ['hoops'], mouth: 'smirk', lashes: true },
  { id: 'f09', gender: 'f', face: 'round', skin: 3, hair: 'bald', hairColor: HAIR.dark, shirt: '#7DD3C0', acc: ['hijab', 'glasses'], accColor: '#FF8A80', lashes: true },
  { id: 'f10', gender: 'f', face: 'oval', skin: 1, hair: 'long', hairColor: HAIR.platinum, shirt: '#E9E1FF', acc: ['flowers'], mouth: 'grin', lashes: true },
  { id: 'f11', gender: 'f', face: 'round', skin: 5, hair: 'afro', hairColor: HAIR.dark, shirt: '#F2994A', acc: ['headband', 'earrings'], accColor: '#FFC857', lashes: true },
  // Erkek
  { id: 'm01', gender: 'm', face: 'square', skin: 1, hair: 'short', hairColor: HAIR.black, shirt: '#5B8DEF', acc: [], mouth: 'grin' },
  { id: 'm02', gender: 'm', face: 'oval', skin: 0, hair: 'side', hairColor: HAIR.brown, shirt: '#674BB5', acc: ['glasses'] },
  { id: 'm03', gender: 'm', face: 'round', skin: 4, hair: 'curly', hairColor: HAIR.black, shirt: '#FFC857', acc: ['stubble'], mouth: 'grin' },
  { id: 'm04', gender: 'm', face: 'square', skin: 0, hair: 'quiff', hairColor: HAIR.blonde, shirt: '#FF6B6B', acc: [], mouth: 'smirk' },
  { id: 'm05', gender: 'm', face: 'square', skin: 3, hair: 'buzz', hairColor: HAIR.dark, shirt: '#1E1B1C', acc: ['beard'] },
  { id: 'm06', gender: 'm', face: 'round', skin: 2, hair: 'short', hairColor: HAIR.dark, shirt: '#6FCF97', acc: ['cap'], accColor: '#FF6B6B', mouth: 'grin' },
  { id: 'm07', gender: 'm', face: 'oval', skin: 5, hair: 'bald', hairColor: HAIR.black, shirt: '#F2994A', acc: ['beard', 'sunglasses'] },
  { id: 'm08', gender: 'm', face: 'oval', skin: 0, hair: 'side', hairColor: HAIR.ginger, shirt: '#7DD3C0', acc: ['freckles', 'mustache'] },
  { id: 'm09', gender: 'm', face: 'round', skin: 2, hair: 'short', hairColor: HAIR.brown, shirt: '#A88BEB', acc: ['beanie', 'stubble'], accColor: '#FFC857' },
  { id: 'm10', gender: 'm', face: 'round', skin: 5, hair: 'afro', hairColor: HAIR.black, shirt: '#FF8FA3', acc: ['earrings'], mouth: 'grin' },
  { id: 'm11', gender: 'm', face: 'square', skin: 1, hair: 'short', hairColor: HAIR.gray, shirt: '#4A6FA5', acc: ['mustache', 'roundGlasses'] },
  // Diğer / nötr
  { id: 'n01', gender: 'n', face: 'round', skin: 2, hair: 'pixie', hairColor: HAIR.lilac, shirt: '#1E1B1C', acc: ['sunglasses', 'earrings'], mouth: 'smirk' },
  { id: 'n02', gender: 'n', face: 'oval', skin: 1, hair: 'curly', hairColor: HAIR.blue, shirt: '#FFC857', acc: ['headphones'], accColor: '#674BB5', mouth: 'grin' },
  { id: 'n03', gender: 'n', face: 'round', skin: 4, hair: 'bob', hairColor: HAIR.mint, shirt: '#FF6B6B', acc: ['cap'], accColor: '#5B8DEF' },
  { id: 'n04', gender: 'n', face: 'square', skin: 3, hair: 'quiff', hairColor: HAIR.platinum, shirt: '#674BB5', acc: ['hoops', 'freckles'] },
];

const BY_ID = new Map(AVATAR_PRESETS.map((p) => [p.id, p]));
export const getPreset = (id: string) => BY_ID.get(id) ?? null;
