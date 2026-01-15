import type { Resource, ResourceCollection } from '@/types/resource';
import { ResourceType } from '@/types/resource';

/**
 * Item types that map to specific resource content types
 */
const ITEM_TYPE_TO_RESOURCE_TYPE: Record<string, ResourceType[]> = {
  'Chant': [ResourceType.LYRICS, ResourceType.YOUTUBE, ResourceType.AUDIO],
  'Louange': [ResourceType.LYRICS, ResourceType.YOUTUBE, ResourceType.AUDIO],
  'Adoration': [ResourceType.LYRICS, ResourceType.YOUTUBE, ResourceType.AUDIO],
  'Lecture biblique': [ResourceType.LYRICS],
  'Prédication': [ResourceType.LYRICS, ResourceType.FILE],
  'Annonce': [ResourceType.FILE],
  'Témoignage': [ResourceType.LYRICS],
  'Prière': [ResourceType.LYRICS]
};

/**
 * Calculate fuzzy match score between two strings
 * Returns a score from 0 to 1, where 1 is a perfect match
 */
export const fuzzyMatchScore = (query: string, target: string): number => {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q || !t) return 0;
  if (t === q) return 1;
  if (t.includes(q)) return 0.9;
  if (q.includes(t)) return 0.8;

  // Calculate word overlap
  const queryWords = q.split(/\s+/).filter(w => w.length > 2);
  const targetWords = t.split(/\s+/).filter(w => w.length > 2);

  if (queryWords.length === 0 || targetWords.length === 0) return 0;

  let matchedWords = 0;
  for (const qWord of queryWords) {
    for (const tWord of targetWords) {
      if (tWord.includes(qWord) || qWord.includes(tWord)) {
        matchedWords++;
        break;
      }
    }
  }

  return matchedWords / Math.max(queryWords.length, targetWords.length);
};

/**
 * Get suggested resources based on item type
 */
export const getSuggestionsByItemType = (
  itemType: string,
  resources: Resource[],
  excludeIds: string[] = [],
  limit = 5
): Resource[] => {
  const preferredTypes = ITEM_TYPE_TO_RESOURCE_TYPE[itemType];

  if (!preferredTypes) {
    // No specific type preference, return recent/popular resources
    return resources
      .filter(r => !excludeIds.includes(r.id))
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
      .slice(0, limit);
  }

  // Filter resources that have matching content types
  const matchingResources = resources.filter(r => {
    if (excludeIds.includes(r.id)) return false;
    if (!r.contents || r.contents.length === 0) return false;
    return r.contents.some(c => preferredTypes.includes(c.type as ResourceType));
  });

  // Sort by view count (popularity)
  return matchingResources
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, limit);
};

/**
 * Get suggested resources based on item title (fuzzy matching)
 */
export const getSuggestionsByTitle = (
  itemTitle: string,
  resources: Resource[],
  excludeIds: string[] = [],
  limit = 3
): Resource[] => {
  if (!itemTitle || itemTitle.trim().length < 3) return [];

  const scoredResources = resources
    .filter(r => !excludeIds.includes(r.id))
    .map(r => ({
      resource: r,
      score: Math.max(
        fuzzyMatchScore(itemTitle, r.title),
        // Also check tags
        ...(r.tags || []).map(tag => fuzzyMatchScore(itemTitle, tag))
      )
    }))
    .filter(item => item.score >= 0.3) // Minimum threshold
    .sort((a, b) => b.score - a.score);

  return scoredResources.slice(0, limit).map(item => item.resource);
};

/**
 * Get combined suggestions based on both item type and title
 * Prioritizes title matches, then adds type-based suggestions
 */
export const getSmartSuggestions = (
  itemType: string,
  itemTitle: string,
  resources: Resource[],
  excludeIds: string[] = [],
  limit = 5
): Resource[] => {
  const suggestions: Resource[] = [];
  const addedIds = new Set<string>();

  // First, add title-based matches (highest priority)
  const titleMatches = getSuggestionsByTitle(itemTitle, resources, excludeIds, 3);
  for (const r of titleMatches) {
    if (!addedIds.has(r.id)) {
      suggestions.push(r);
      addedIds.add(r.id);
    }
  }

  // Then, add type-based suggestions
  const typeMatches = getSuggestionsByItemType(
    itemType,
    resources,
    [...excludeIds, ...Array.from(addedIds)],
    limit - suggestions.length
  );
  for (const r of typeMatches) {
    if (!addedIds.has(r.id) && suggestions.length < limit) {
      suggestions.push(r);
      addedIds.add(r.id);
    }
  }

  return suggestions;
};

/**
 * Check if a resource is likely a song (for "Chant" type items)
 */
export const isSongResource = (resource: Resource): boolean => {
  if (!resource.contents) return false;
  return resource.contents.some(c =>
    c.type === ResourceType.LYRICS ||
    c.type === ResourceType.YOUTUBE ||
    c.type === ResourceType.AUDIO
  );
};

/**
 * Get the primary content type icon for a resource
 */
export const getResourceTypeIcon = (resource: Resource): string => {
  if (!resource.contents || resource.contents.length === 0) return '📄';

  const types = resource.contents.map(c => c.type);
  if (types.includes(ResourceType.LYRICS)) return '🎵';
  if (types.includes(ResourceType.YOUTUBE)) return '▶️';
  if (types.includes(ResourceType.VIDEO)) return '🎥';
  if (types.includes(ResourceType.AUDIO)) return '🔊';
  if (types.includes(ResourceType.MUSIC_SHEET)) return '🎼';
  if (types.includes(ResourceType.FILE)) return '📄';
  return '📄';
};
