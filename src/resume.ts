import type { ContentItem } from './content.ts';

/** The order the room's objects and the plain resume use. Matches `content.ts`. */
export const SECTION_ORDER = ['awards', 'academics', 'schedule', 'projects'] as const;
export type SectionKey = (typeof SECTION_ORDER)[number];

/**
 * Render every content item as a <section> for the plain resume page. Runs at build
 * time (see `vite.config.ts`), so the text is in the HTML for screen readers,
 * search engines, link unfurlers and browsers without JavaScript or WebGL.
 */
export function renderResumeSections(content: Record<string, ContentItem>, order: readonly string[] = SECTION_ORDER): string {
  const keys = [...order.filter((k) => k in content), ...Object.keys(content).filter((k) => !order.includes(k))];
  return keys
    .map((key) => `<section id="${key}" class="resume-section resume-content">${content[key]!.html}</section>`)
    .join('\n');
}
