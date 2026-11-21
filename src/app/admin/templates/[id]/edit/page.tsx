'use client';

import { useParams } from 'next/navigation';
import ContentTemplateForm from '@/components/admin/ContentTemplateForm';

export default function ContentTemplateEditPage() {
  const params = useParams();
  return <ContentTemplateForm id={String(params.id)} />;
}
