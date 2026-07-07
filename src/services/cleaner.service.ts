import * as cheerio from 'cheerio';

export class CleanerService {
  /**
   * PDF Kurallarına göre HTML temizliği yapar.
   * - İstenmeyen etiketler silinir.
   * - SVG optimize edilir.
   * - Gereksiz attributelar silinir (class, id, data-*, aria-*, href, src, alt gibi temel özellikler hariç).
   */
  clean(rawHtml: string): string {
    const $ = cheerio.load(rawHtml);

    // 1. İstenmeyen etiketleri sil
    $('script, style, noscript, iframe, meta').remove();

    // 2. SVG optimizasyonu: İçeriğini temizle ve class="icon" ekle
    $('svg').each((_, el) => {
      $(el).empty(); // İçindeki path vb. yüzlerce satırı sil
      $(el).attr('class', 'icon');
    });

    // 3. İstenmeyen attribute'ları sil
    const allowedAttributes = ['class', 'id', 'href', 'src', 'alt', 'type', 'name', 'value', 'placeholder'];

    $('*').each((_, el) => {
      if (el.type === 'tag') {
        const attribs = el.attribs;
        const keys = Object.keys(attribs);
        
        for (const key of keys) {
          const isAllowed = 
            allowedAttributes.includes(key) || 
            key.startsWith('data-') || 
            key.startsWith('aria-');

          if (!isAllowed) {
            $(el).removeAttr(key);
          }
        }
      }
    });

    return $.html();
  }
}
