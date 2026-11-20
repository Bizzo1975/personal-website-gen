import { redirect } from 'next/navigation';

// W17/W19: newsletters are campaigns (see ../../page.tsx).
export default async function NewsletterEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/newsletter/campaigns/${encodeURIComponent(id)}/edit`);
}
