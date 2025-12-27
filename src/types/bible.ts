/**
 * Bible Types for Scripture Reference Parsing and API Integration
 * Used with bolls.life API for French Louis Segond (FRLSG)
 */

export interface BibleReference {
  book: string;           // French book name (normalized)
  bookId: number;         // API book ID (1-66)
  chapter: number;
  verseStart: number;
  verseEnd?: number;      // Optional for verse ranges
}

export interface BibleVerse {
  book: number;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleApiResponse {
  pk: number;
  verse: number;
  text: string;
}

export interface ScriptureContent {
  reference: string;      // Display reference (e.g., "Jean 3:16-18")
  text: string;           // Formatted verse text
  version: string;        // Bible version (e.g., "LSG")
}
