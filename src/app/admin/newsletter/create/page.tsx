import { redirect } from 'next/navigation';

// W17/W19: this page saved nothing (a 1.5 s fake save over mock posts and templates).
// Creating a newsletter means creating a campaign; a chosen template is carried over.
export default async function CreateNewsletterPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  redirect(template
    ? `/admin/newsletter/campaigns/create?template=${encodeURIComponent(template)}`
    : '/admin/newsletter/campaigns/create');
}
