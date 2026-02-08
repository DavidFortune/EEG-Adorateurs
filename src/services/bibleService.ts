/**
 * Bible Service for Scripture Reference Parsing and API Integration
 * Uses bolls.life API with French Louis Segond (FRLSG) translation
 */

import type { BibleReference, BibleVerse, BibleApiResponse } from '@/types/bible';

const API_BASE = 'https://bolls.life';
const CORS_PROXY = 'https://corsproxy.io/?';
const TRANSLATION = 'FRLSG';

/**
 * French book names mapping to API book IDs (1-66)
 * Includes common abbreviations and variations
 */
const FRENCH_BOOKS: Record<string, number> = {
  // Old Testament
  'genèse': 1, 'genese': 1, 'gen': 1, 'gn': 1,
  'exode': 2, 'ex': 2,
  'lévitique': 3, 'levitique': 3, 'lev': 3, 'lv': 3,
  'nombres': 4, 'nom': 4, 'nb': 4,
  'deutéronome': 5, 'deuteronome': 5, 'deut': 5, 'dt': 5,
  'josué': 6, 'josue': 6, 'jos': 6,
  'juges': 7, 'jug': 7, 'jg': 7,
  'ruth': 8, 'ru': 8, 'rt': 8,
  '1 samuel': 9, '1samuel': 9, '1 sam': 9, '1sam': 9, '1 s': 9, '1s': 9,
  '2 samuel': 10, '2samuel': 10, '2 sam': 10, '2sam': 10, '2 s': 10, '2s': 10,
  '1 rois': 11, '1rois': 11, '1 r': 11, '1r': 11,
  '2 rois': 12, '2rois': 12, '2 r': 12, '2r': 12,
  '1 chroniques': 13, '1chroniques': 13, '1 ch': 13, '1ch': 13, '1 chr': 13,
  '2 chroniques': 14, '2chroniques': 14, '2 ch': 14, '2ch': 14, '2 chr': 14,
  'esdras': 15, 'esd': 15, 'esr': 15,
  'néhémie': 16, 'nehemie': 16, 'neh': 16, 'né': 16, 'ne': 16,
  'esther': 17, 'est': 17,
  'job': 18, 'jb': 18,
  'psaume': 19, 'psaumes': 19, 'ps': 19, 'psa': 19,
  'proverbes': 20, 'prov': 20, 'pr': 20,
  'ecclésiaste': 21, 'ecclesiaste': 21, 'ecc': 21, 'ec': 21, 'qo': 21,
  'cantique': 22, 'cantique des cantiques': 22, 'cant': 22, 'ct': 22, 'cc': 22,
  'ésaïe': 23, 'esaïe': 23, 'esaie': 23, 'isaïe': 23, 'isaie': 23, 'es': 23, 'esa': 23, 'is': 23,
  'jérémie': 24, 'jeremie': 24, 'jer': 24, 'jr': 24,
  'lamentations': 25, 'lam': 25, 'la': 25,
  'ézéchiel': 26, 'ezechiel': 26, 'ez': 26, 'ezk': 26,
  'daniel': 27, 'dan': 27, 'da': 27, 'dn': 27,
  'osée': 28, 'osee': 28, 'os': 28,
  'joël': 29, 'joel': 29, 'jl': 29,
  'amos': 30, 'am': 30,
  'abdias': 31, 'abd': 31, 'ab': 31,
  'jonas': 32, 'jon': 32,
  'michée': 33, 'michee': 33, 'mic': 33, 'mi': 33,
  'nahum': 34, 'nah': 34, 'na': 34,
  'habakuk': 35, 'habacuc': 35, 'hab': 35, 'ha': 35,
  'sophonie': 36, 'soph': 36, 'so': 36,
  'aggée': 37, 'aggee': 37, 'ag': 37,
  'zacharie': 38, 'zach': 38, 'za': 38, 'zc': 38,
  'malachie': 39, 'mal': 39, 'ml': 39,
  // New Testament
  'matthieu': 40, 'matt': 40, 'mat': 40, 'mt': 40,
  'marc': 41, 'mc': 41, 'mr': 41,
  'luc': 42, 'lc': 42,
  'jean': 43, 'jn': 43,
  'actes': 44, 'actes des apôtres': 44, 'act': 44, 'ac': 44,
  'romains': 45, 'rom': 45, 'rm': 45, 'ro': 45,
  '1 corinthiens': 46, '1corinthiens': 46, '1 cor': 46, '1cor': 46, '1 co': 46, '1co': 46,
  '2 corinthiens': 47, '2corinthiens': 47, '2 cor': 47, '2cor': 47, '2 co': 47, '2co': 47,
  'galates': 48, 'gal': 48, 'ga': 48,
  'éphésiens': 49, 'ephesiens': 49, 'eph': 49, 'ep': 49,
  'philippiens': 50, 'phil': 50, 'php': 50, 'ph': 50,
  'colossiens': 51, 'col': 51,
  '1 thessaloniciens': 52, '1thessaloniciens': 52, '1 thess': 52, '1thess': 52, '1 th': 52, '1th': 52,
  '2 thessaloniciens': 53, '2thessaloniciens': 53, '2 thess': 53, '2thess': 53, '2 th': 53, '2th': 53,
  '1 timothée': 54, '1timothée': 54, '1 timothee': 54, '1timothee': 54, '1 tim': 54, '1tim': 54, '1 tm': 54, '1tm': 54,
  '2 timothée': 55, '2timothée': 55, '2 timothee': 55, '2timothee': 55, '2 tim': 55, '2tim': 55, '2 tm': 55, '2tm': 55,
  'tite': 56, 'tt': 56,
  'philémon': 57, 'philemon': 57, 'phm': 57,
  'hébreux': 58, 'hebreux': 58, 'heb': 58, 'he': 58,
  'jacques': 59, 'jac': 59, 'jc': 59,
  '1 pierre': 60, '1pierre': 60, '1 pi': 60, '1pi': 60, '1 p': 60, '1p': 60,
  '2 pierre': 61, '2pierre': 61, '2 pi': 61, '2pi': 61, '2 p': 61, '2p': 61,
  '1 jean': 62, '1jean': 62, '1 jn': 62, '1jn': 62,
  '2 jean': 63, '2jean': 63, '2 jn': 63, '2jn': 63,
  '3 jean': 64, '3jean': 64, '3 jn': 64, '3jn': 64,
  'jude': 65, 'jd': 65,
  'apocalypse': 66, 'apoc': 66, 'ap': 66, 'apo': 66, 'révélation': 66, 'revelation': 66
};

/**
 * Normalize a book name by removing accents, periods, and extra spaces
 */
function normalizeBookName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

/**
 * Parse a French Bible reference string into structured components
 * Supports formats:
 * - "Jean 3:16" (single verse)
 * - "Psaume 23:1-6" (verse range)
 * - "1 Corinthiens 13:4-7" (numbered book with range)
 * - "Psaumes 100" (full chapter - fetches all verses)
 * - "Gen 1:1" (abbreviated)
 */
export function parseBibleReference(input: string): BibleReference | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();

  // Regex to match Bible references
  // Groups: [full match, book (with optional number prefix), chapter, verseStart?, verseEnd?]
  const regex = /^(\d?\s?[a-zA-ZéèêëàâäùûüôöîïçÉÈÊËÀÂÄÙÛÜÔÖÎÏÇ]+\.?)\s*(\d+)(?::(\d+)(?:\s*[-–—]\s*(\d+))?)?$/i;

  const match = trimmed.match(regex);
  if (!match) {
    return null;
  }

  const [, bookPart, chapterStr, verseStartStr, verseEndStr] = match;

  const normalizedBook = normalizeBookName(bookPart);
  const bookId = FRENCH_BOOKS[normalizedBook];

  if (!bookId) {
    return null;
  }

  const chapter = parseInt(chapterStr, 10);
  const verseStart = verseStartStr ? parseInt(verseStartStr, 10) : undefined;
  const verseEnd = verseEndStr ? parseInt(verseEndStr, 10) : undefined;

  return {
    book: bookPart.trim(),
    bookId,
    chapter,
    verseStart,
    verseEnd
  };
}

/**
 * Fetch verses from the bolls.life API using CORS proxy
 * We fetch the entire chapter and filter the verses we need
 */
export async function fetchVerses(reference: BibleReference): Promise<BibleVerse[]> {
  const { bookId, chapter, verseStart, verseEnd } = reference;

  try {
    // Fetch the entire chapter (works better with CORS proxy)
    const apiUrl = `${API_BASE}/get-text/${TRANSLATION}/${bookId}/${chapter}/`;
    const response = await fetch(`${CORS_PROXY}${encodeURIComponent(apiUrl)}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data: BibleApiResponse[] = await response.json();

    // If no verseStart specified, return all verses (whole chapter)
    // Otherwise filter to the specified range
    let filteredData = data;
    if (verseStart !== undefined) {
      const endVerse = verseEnd || verseStart;
      filteredData = data.filter(item =>
        item.verse >= verseStart && item.verse <= endVerse
      );
    }

    return filteredData.map(item => ({
      book: bookId,
      chapter,
      verse: item.verse,
      text: item.text
    }));
  } catch (error) {
    console.error('Error fetching Bible verses:', error);
    throw error;
  }
}

/**
 * Format verses for display with verse numbers
 */
export function formatVersesForDisplay(verses: BibleVerse[]): string {
  if (!verses || verses.length === 0) {
    return '';
  }

  return verses
    .sort((a, b) => a.verse - b.verse)
    .map(v => `${v.verse} ${v.text.trim()}`)
    .join('\n\n');
}

/**
 * Format reference for display (e.g., "Jean 3:16-18" or "Psaumes 100")
 */
export function formatReferenceForDisplay(reference: BibleReference): string {
  const { book, chapter, verseStart, verseEnd } = reference;

  // Whole chapter (no verses specified)
  if (verseStart === undefined) {
    return `${book} ${chapter}`;
  }

  if (verseEnd && verseEnd > verseStart) {
    return `${book} ${chapter}:${verseStart}-${verseEnd}`;
  }
  return `${book} ${chapter}:${verseStart}`;
}

/**
 * Main function to fetch and format scripture from a reference string
 */
export async function getScripture(referenceString: string): Promise<{
  reference: string;
  text: string;
  version: string;
} | null> {
  const parsed = parseBibleReference(referenceString);

  if (!parsed) {
    return null;
  }

  try {
    const verses = await fetchVerses(parsed);
    const formattedText = formatVersesForDisplay(verses);
    const formattedReference = formatReferenceForDisplay(parsed);

    return {
      reference: formattedReference,
      text: formattedText,
      version: 'Louis Segond 1910'
    };
  } catch (error) {
    console.error('Error getting scripture:', error);
    throw error;
  }
}

export const bibleService = {
  parseBibleReference,
  fetchVerses,
  formatVersesForDisplay,
  formatReferenceForDisplay,
  getScripture
};