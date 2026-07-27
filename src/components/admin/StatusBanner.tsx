import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export type AdminStatusState = {
  type: 'pending' | 'success' | 'error';
  message: string;
} | null;

export function AdminStatusBanner({
  status,
}: {
  status: Exclude<AdminStatusState, null>;
}) {
  const styles =
    status.type === 'error'
      ? {
          card: 'border-red-500/30 bg-red-500/10',
          icon: 'text-red-300',
          title: 'text-red-200',
          body: 'text-red-200/80',
          Icon: AlertCircle,
          titleText: 'Action failed',
        }
      : status.type === 'success'
        ? {
            card: 'border-emerald-500/30 bg-emerald-500/10',
            icon: 'text-emerald-300',
            title: 'text-emerald-200',
            body: 'text-emerald-200/80',
            Icon: CheckCircle2,
            titleText: 'Completed',
          }
        : {
            card: 'border-hx-gold/30 bg-hx-gold/10',
            icon: 'text-hx-gold-bright',
            title: 'text-hx-gold-bright',
            body: 'text-hx-gold/80',
            Icon: Loader2,
            titleText: 'Working',
          };

  return (
    <Card className={`rounded-sm backdrop-blur-md ${styles.card}`}>
      <CardContent
        className="flex items-start gap-3 p-4"
        role={status.type === 'error' ? 'alert' : 'status'}
      >
        <styles.Icon
          className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon} ${
            status.type === 'pending' ? 'animate-spin' : ''
          }`}
        />
        <div>
          <h4 className={`font-medium ${styles.title}`}>{styles.titleText}</h4>
          <p className={`mt-1 text-sm ${styles.body}`}>{status.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
