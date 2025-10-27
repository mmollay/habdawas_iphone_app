import { supabase } from '../lib/supabase';

export interface AltTextExportItem {
  id: string;
  title: string;
  image_url: string;
  ai_alt_text: string;
  category?: string;
  created_at: string;
}

/**
 * Export all alt texts from items with AI-generated descriptions
 */
export async function exportAltTexts(): Promise<void> {
  try {
    // Fetch all AI-generated items with their images
    const { data: items, error } = await supabase
      .from('items')
      .select(`
        id,
        title,
        description,
        tags,
        created_at,
        category:categories(slug, translations)
      `)
      .eq('ai_generated', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch images for these items
    const itemIds = items?.map(item => item.id) || [];
    const { data: images, error: imagesError } = await supabase
      .from('item_images')
      .select('item_id, image_url, display_order')
      .in('item_id', itemIds)
      .order('display_order', { ascending: true });

    if (imagesError) throw imagesError;

    // Process items and create alt texts from description and tags
    const exportData: AltTextExportItem[] = [];

    items?.forEach(item => {
      const itemImages = images?.filter(img => img.item_id === item.id) || [];
      const categoryName = item.category?.translations?.de?.name || item.category?.slug || 'Unbekannt';

      itemImages.forEach((image, index) => {
        // Create alt text from title, description, and tags
        const tags = (item.tags as string[]) || [];
        const altText = `${item.title}${tags.length > 0 ? ' - ' + tags.slice(0, 3).join(', ') : ''}`;

        exportData.push({
          id: item.id,
          title: item.title,
          image_url: image.image_url,
          ai_alt_text: altText,
          category: categoryName,
          created_at: item.created_at,
        });
      });
    });

    // Create CSV content
    const csvHeader = 'ID,Title,Image URL,Alt Text,Category,Created At\n';
    const csvRows = exportData.map(row =>
      `"${row.id}","${row.title.replace(/"/g, '""')}","${row.image_url}","${row.ai_alt_text.replace(/"/g, '""')}","${row.category}","${row.created_at}"`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    // Create JSON content
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Trigger downloads
    downloadFile(csvContent, `alt-texts-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    downloadFile(jsonContent, `alt-texts-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');

    console.log(`✅ Exported ${exportData.length} alt texts from ${items?.length || 0} items`);

  } catch (error) {
    console.error('Error exporting alt texts:', error);
    throw error;
  }
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get statistics about alt texts
 */
export async function getAltTextStats(): Promise<{
  total: number;
  withAltText: number;
  percentage: number;
}> {
  try {
    const { count: total } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true });

    const { count: withAltText } = await supabase
      .from('items')
      .select('*', { count: 'exact', head: true })
      .eq('ai_generated', true);

    const percentage = total ? Math.round((withAltText! / total) * 100) : 0;

    return {
      total: total || 0,
      withAltText: withAltText || 0,
      percentage,
    };
  } catch (error) {
    console.error('Error getting alt text stats:', error);
    return { total: 0, withAltText: 0, percentage: 0 };
  }
}
