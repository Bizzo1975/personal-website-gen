import { redirect } from 'next/navigation';

// W17/W19: newsletters are campaigns (see ../page.tsx).
export default async function NewsletterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/newsletter/campaigns/${encodeURIComponent(id)}/preview`);
}
