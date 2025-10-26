import { useState } from 'react';
import { CategorySelection } from '../types/categories';
import { supabase } from '../lib/supabase';

interface CategorySuggestion {
  path: string;
  categorySelection: CategorySelection;
  confidence: number;
  reasoning: string;
}

interface UseCategorySuggestionsReturn {
  suggestions: CategorySuggestion[];
  loading: boolean;
  error: string | null;
  getSuggestions: (title: string, description: string) => Promise<void>;
}

/**
 * Hook für AI-basierte Kategorie-Vorschläge
 *
 * Analysiert Titel und Beschreibung eines Items und schlägt
 * passende Kategorien aus der Datenbank vor.
 */
export const useCategorySuggestions = (): UseCategorySuggestionsReturn => {
  const [suggestions, setSuggestions] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = async (title: string, description: string) => {
    if (!title || !description) {
      setError('Titel und Beschreibung werden benötigt');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Lade alle verfügbaren Kategorien aus der Datenbank
      const { data: categories, error: dbError } = await supabase
        .from('categories')
        .select('id, parent_id, level, slug, translations')
        .order('level', { ascending: true });

      if (dbError) throw dbError;
      if (!categories) throw new Error('Keine Kategorien gefunden');

      // 2. Baue Kategorie-Hierarchie auf
      const categoryPaths = buildCategoryPaths(categories);

      // 3. Keyword-basierte Analyse (einfache Version ohne externe AI)
      const keywordSuggestions = analyzeByKeywords(
        title,
        description,
        categoryPaths
      );

      setSuggestions(keywordSuggestions);
    } catch (err) {
      console.error('Error getting category suggestions:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Vorschläge');
    } finally {
      setLoading(false);
    }
  };

  return {
    suggestions,
    loading,
    error,
    getSuggestions,
  };
};

/**
 * Baut vollständige Kategorie-Pfade aus der flachen Kategorieliste
 */
function buildCategoryPaths(categories: any[]): CategoryPath[] {
  const categoryMap = new Map(categories.map(cat => [cat.id, cat]));
  const paths: CategoryPath[] = [];

  // Finde alle Endkategorien (Level 3 oder 4)
  const endCategories = categories.filter(cat => cat.level >= 3);

  endCategories.forEach(endCat => {
    const path: string[] = [];
    const selection: CategorySelection = {};
    let current = endCat;

    // Traversiere nach oben bis zur Root
    while (current) {
      const name = current.translations?.de?.name || 'Unbekannt';
      path.unshift(name);

      // Speichere IDs für CategorySelection
      if (current.level === 1) selection.level1 = current.id;
      else if (current.level === 2) selection.level2 = current.id;
      else if (current.level === 3) selection.level3 = current.id;
      else if (current.level === 4) selection.level4 = current.id;

      current = current.parent_id ? categoryMap.get(current.parent_id) : null;
    }

    paths.push({
      fullPath: path.join(' › '),
      pathArray: path,
      selection,
      endCategoryId: endCat.id,
      keywords: extractKeywords(path),
    });
  });

  return paths;
}

interface CategoryPath {
  fullPath: string;
  pathArray: string[];
  selection: CategorySelection;
  endCategoryId: string;
  keywords: string[];
}

/**
 * Extrahiert Keywords aus einem Kategorie-Pfad
 */
function extractKeywords(pathArray: string[]): string[] {
  const keywords: string[] = [];

  pathArray.forEach(segment => {
    // Splitte nach Worten und entferne häufige Füllwörter
    const words = segment
      .toLowerCase()
      .split(/[\s&,-]+/)
      .filter(word =>
        word.length > 2 &&
        !['und', 'der', 'die', 'das', 'für', 'von', 'mit'].includes(word)
      );

    keywords.push(...words);
  });

  return keywords;
}

/**
 * Analysiert Titel und Beschreibung und findet passende Kategorien
 * basierend auf Keyword-Matching
 */
function analyzeByKeywords(
  title: string,
  description: string,
  categoryPaths: CategoryPath[]
): CategorySuggestion[] {
  const text = `${title} ${description}`.toLowerCase();
  const suggestions: CategorySuggestion[] = [];

  // Berechne Relevanz-Score für jede Kategorie
  categoryPaths.forEach(catPath => {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Prüfe jeden Keyword aus der Kategorie
    catPath.keywords.forEach(keyword => {
      if (text.includes(keyword)) {
        score += keyword.length; // Längere Keywords = höherer Score
        matchedKeywords.push(keyword);
      }
    });

    // Bonus für mehrere Treffer
    if (matchedKeywords.length > 1) {
      score *= 1.5;
    }

    // Nur Kategorien mit Score > 0 vorschlagen
    if (score > 0) {
      suggestions.push({
        path: catPath.fullPath,
        categorySelection: catPath.selection,
        confidence: Math.min(score / 20, 1), // Normalisiert auf 0-1
        reasoning: `Passende Keywords: ${matchedKeywords.join(', ')}`,
      });
    }
  });

  // Sortiere nach Confidence und nimm Top 3
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

/**
 * Erweiterte Version mit OpenAI/Claude API (optional)
 *
 * Diese Funktion kann später aktiviert werden, wenn du
 * eine AI API anbinden möchtest.
 */
export async function getAISuggestions(
  title: string,
  description: string,
  categories: string[]
): Promise<CategorySuggestion[]> {
  // Beispiel OpenAI API Call (auskommentiert):
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'Du bist ein Kategorisierungs-Experte für einen Online-Marktplatz.',
        },
        {
          role: 'user',
          content: `
Analysiere dieses Produkt und schlage die 3 passendsten Kategorien vor:

Titel: ${title}
Beschreibung: ${description}

Verfügbare Kategorien:
${categories.join('\n')}

Antworte im JSON-Format:
[
  {
    "path": "Kategorie › Unterkategorie › Unterkategorie",
    "confidence": 0.95,
    "reasoning": "Begründung warum diese Kategorie passt"
  }
]
          `,
        },
      ],
      temperature: 0.3,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
  */

  throw new Error('AI API noch nicht konfiguriert');
}
