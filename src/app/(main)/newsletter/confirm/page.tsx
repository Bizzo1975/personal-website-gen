import TokenAction from '@/components/newsletter/TokenAction';

export const metadata = { title: 'Confirm newsletter subscription', robots: { index: false } };

export default function NewsletterConfirmPage() {
  return (
    <TokenAction
      endpoint="/api/newsletter/confirm"
      title="Confirm your subscription"
      intro="Click the button to confirm that you want to receive the Will Work for Lunch newsletter."
      buttonLabel="Confirm subscription"
      doneMessage="Thanks — your subscription is confirmed. You'll receive the next newsletter."
    />
  );
}
