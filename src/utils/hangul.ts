// Unicode Hangul Jamo decomposition/composition for Korean verb conjugation
// Hangul syllable = (initial * 21 + medial) * 28 + final + 0xAC00

const HANGUL_BASE = 0xAC00;
const INITIAL_COUNT = 19;
const MEDIAL_COUNT = 21;
const FINAL_COUNT = 28; // 0 = no final consonant

// Initial consonants (초성)
export const INITIALS = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

// Medial vowels (중성)
export const MEDIALS = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ',
  'ㅣ',
];

// Final consonants (종성) — index 0 means no final
export const FINALS = [
  '', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ',
  'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

export interface Jamo {
  initial: number;  // index into INITIALS
  medial: number;   // index into MEDIALS
  final: number;    // index into FINALS (0 = none)
}

/** Check if a character is a Hangul syllable */
export function isHangul(ch: string): boolean {
  const code = ch.charCodeAt(0);
  return code >= 0xAC00 && code <= 0xD7A3;
}

/** Decompose a Hangul syllable into initial, medial, final indices */
export function decompose(ch: string): Jamo {
  const code = ch.charCodeAt(0) - HANGUL_BASE;
  const initial = Math.floor(code / (MEDIAL_COUNT * FINAL_COUNT));
  const medial = Math.floor((code % (MEDIAL_COUNT * FINAL_COUNT)) / FINAL_COUNT);
  const final_ = code % FINAL_COUNT;
  return { initial, medial, final: final_ };
}

/** Compose a Hangul syllable from initial, medial, final indices */
export function compose(initial: number, medial: number, final_: number): string {
  const code = HANGUL_BASE + (initial * MEDIAL_COUNT + medial) * FINAL_COUNT + final_;
  return String.fromCharCode(code);
}

/** Get the last syllable of a string */
export function getLastSyllable(str: string): string {
  return str[str.length - 1];
}

/** Check if the last syllable has a final consonant (받침) */
export function hasFinalConsonant(str: string): boolean {
  const last = getLastSyllable(str);
  if (!isHangul(last)) return false;
  return decompose(last).final !== 0;
}

/** Get the final consonant character of the last syllable, or '' if none */
export function getFinalConsonant(str: string): string {
  const last = getLastSyllable(str);
  if (!isHangul(last)) return '';
  return FINALS[decompose(last).final];
}

/** Get the medial vowel character of the last syllable */
export function getMedialVowel(str: string): string {
  const last = getLastSyllable(str);
  if (!isHangul(last)) return '';
  return MEDIALS[decompose(last).medial];
}

/** Remove the final consonant from the last syllable */
export function removeFinal(str: string): string {
  const last = getLastSyllable(str);
  if (!isHangul(last)) return str;
  const jamo = decompose(last);
  return str.slice(0, -1) + compose(jamo.initial, jamo.medial, 0);
}

/** Replace the final consonant of the last syllable */
export function replaceFinal(str: string, newFinal: string): string {
  const last = getLastSyllable(str);
  if (!isHangul(last)) return str;
  const jamo = decompose(last);
  const finalIdx = FINALS.indexOf(newFinal);
  return str.slice(0, -1) + compose(jamo.initial, jamo.medial, finalIdx >= 0 ? finalIdx : 0);
}

/** Add a final consonant to the last syllable (which should have no final) */
export function addFinal(str: string, final_: string): string {
  return replaceFinal(str, final_);
}

/** Check if the vowel in the last syllable is "bright" (양성모음: ㅏ, ㅗ, ㅑ) */
export function isBrightVowel(str: string): boolean {
  const vowel = getMedialVowel(str);
  return ['ㅏ', 'ㅗ', 'ㅑ', 'ㅘ'].includes(vowel);
}

/** Get the stem of a Korean verb (remove 다) */
export function getStem(verb: string): string {
  if (verb.endsWith('다')) {
    return verb.slice(0, -1);
  }
  return verb;
}

/** Romanization map for basic search support */
const romanizationMap: [string, string][] = [
  // Double consonants
  ['kk', 'ㄲ'], ['tt', 'ㄸ'], ['pp', 'ㅃ'], ['ss', 'ㅆ'], ['jj', 'ㅉ'],
  // Aspirated
  ['ch', 'ㅊ'], ['kh', 'ㅋ'], ['th', 'ㅌ'], ['ph', 'ㅍ'],
  // Compound vowels
  ['ae', 'ㅐ'], ['ya', 'ㅑ'], ['yae', 'ㅒ'], ['eo', 'ㅓ'],
  ['ye', 'ㅖ'], ['yeo', 'ㅕ'], ['wa', 'ㅘ'], ['wae', 'ㅙ'],
  ['oe', 'ㅚ'], ['yo', 'ㅛ'], ['wo', 'ㅝ'], ['we', 'ㅞ'],
  ['wi', 'ㅟ'], ['yu', 'ㅠ'], ['eu', 'ㅡ'], ['ui', 'ㅢ'],
  // Basic consonants
  ['g', 'ㄱ'], ['n', 'ㄴ'], ['d', 'ㄷ'], ['r', 'ㄹ'], ['l', 'ㄹ'],
  ['m', 'ㅁ'], ['b', 'ㅂ'], ['s', 'ㅅ'], ['j', 'ㅈ'], ['h', 'ㅎ'],
  ['k', 'ㅋ'], ['t', 'ㅌ'], ['p', 'ㅍ'],
  // Basic vowels
  ['a', 'ㅏ'], ['e', 'ㅔ'], ['o', 'ㅗ'], ['u', 'ㅜ'], ['i', 'ㅣ'],
];

/** Convert romanized Korean to a rough hangul search string (best effort) */
export function romanToHangul(input: string): string {
  // This is a simplified conversion for search purposes
  let result = '';
  let remaining = input.toLowerCase();

  while (remaining.length > 0) {
    let matched = false;
    for (const [roman, jamo] of romanizationMap) {
      if (remaining.startsWith(roman)) {
        result += jamo;
        remaining = remaining.slice(roman.length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += remaining[0];
      remaining = remaining.slice(1);
    }
  }

  return result;
}
