'use client';

/**
 * W21: "Use Template" opens /admin/posts/new?template=<id> or /admin/projects/new?template=<id>.
 * This loads that template once, hands its content to the form, and counts one use only
 * after the post/project was really created.
 */
import { useEffect, useState } from 'react';
import type { ContentTemplateDto, TemplateType } from '@/lib/content-templates';

export function useContentTemplate(type: TemplateType, apply: (content: string) => void) {
  const [template, setTemplate] = useState<ContentTemplateDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('template');
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/templates/${encodeURIComponent(id)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.template) {
          setError(res.status === 404 ? 'The chosen template no longer exists.' : data.error || 'The template could not be loaded.');
          return;
        }
        if (data.template.type !== type) {
          setError(`"${data.template.name}" is a ${data.template.type} template, so it was not applied.`);
          return;
        }
        setTemplate(data.template);
        apply(data.template.content);
      } catch {
        setError('The template could not be loaded (network error).');
      }
    })();
    // Runs once per page load; `apply` is a fresh closure each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  /** Call after a successful create. A failure here is logged; the content already exists. */
  const markUsed = async () => {
    if (!template) return;
    try {
      const res = await fetch(`/api/admin/templates/${template.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'used' }),
      });
      if (!res.ok) console.warn('Template use was not counted', res.status);
    } catch (e) {
      console.warn('Template use was not counted', e);
    }
  };

  return { template, error, markUsed };
}
