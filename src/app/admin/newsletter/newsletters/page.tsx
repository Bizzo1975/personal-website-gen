import { redirect } from 'next/navigation';

// W17/W19: "Newsletters" was a second, mock copy of Campaigns (there is no newsletters
// table). Newsletters are campaigns; this keeps old links working.
export default function NewslettersPage() {
  redirect('/admin/newsletter/campaigns');
}
