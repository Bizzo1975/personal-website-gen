import TokenAction from '@/components/newsletter/TokenAction';

export const metadata = { title: 'Unsubscribe from newsletter', robots: { index: false } };

export default function NewsletterUnsubscribePage() {
  return (
    <TokenAction
      endpoint="/api/newsletter/unsubscribe"
      title="Unsubscribe"
      intro="Click the button to stop receiving the Will Work for Lunch newsletter."
      buttonLabel="Unsubscribe"
      doneMessage="You're unsubscribed and won't receive further newsletters."
      askReason
    />
  );
}
