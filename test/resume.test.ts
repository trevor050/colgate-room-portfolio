import { describe, expect, it } from 'vitest';
import { content } from '../src/content.ts';
import { renderResumeSections, SECTION_ORDER } from '../src/resume.ts';

describe('content', () => {
  it('has exactly the sections the room has objects for', () => {
    expect(Object.keys(content).sort()).toEqual([...SECTION_ORDER].sort());
  });

  it('gives every section an <h2>, which labels the dialog', () => {
    for (const item of Object.values(content)) expect(item.html).toMatch(/<h2>[^<]+<\/h2>/);
  });
});

describe('renderResumeSections', () => {
  const html = renderResumeSections(content);

  it('renders one section per content item, in room order, with Dossier-friendly ids', () => {
    const ids = [...html.matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual([...SECTION_ORDER]);
  });

  it('includes every piece of resume content verbatim', () => {
    for (const item of Object.values(content)) expect(html).toContain(item.html);
  });

  it('keeps sections that are not in the order list, after the ordered ones', () => {
    const extra = { ...content, volunteering: { title: 'Volunteering', html: '<h2>Volunteering</h2>' } };
    const ids = [...renderResumeSections(extra).matchAll(/<section id="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toEqual([...SECTION_ORDER, 'volunteering']);
  });
});
