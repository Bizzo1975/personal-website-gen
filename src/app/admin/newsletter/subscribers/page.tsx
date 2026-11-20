import { redirect } from 'next/navigation';

// W19: this page showed mock subscribers. The real subscriber manager is /admin/subscribers.
export default function NewsletterSubscribersPage() {
  redirect('/admin/subscribers');
}
