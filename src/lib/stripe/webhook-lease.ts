export type StripeWebhookLeaseStatus = 'failed' | 'processed' | 'processing';

export function canFinishStripeWebhookAttempt(
  status: StripeWebhookLeaseStatus,
  activeLeaseToken: string | undefined,
  attemptLeaseToken: string
): boolean {
  return (
    status === 'processing' &&
    typeof activeLeaseToken === 'string' &&
    activeLeaseToken === attemptLeaseToken
  );
}
