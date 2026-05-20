import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

export type VariantAlert = 'success' | 'info' | 'warning' | 'danger';

const STYLES_VARIANT: Record<VariantAlert, string> = {
  success: 'bg-success-light text-success border-success/30',
  info: 'bg-info-light text-info border-info/30',
  warning: 'bg-warning-light text-warning border-warning/30',
  danger: 'bg-danger-light text-danger border-danger/30',
};

const ICONES_VARIANT: Record<VariantAlert, typeof Info> = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  danger: XCircle,
};

const ROLES_VARIANT: Record<VariantAlert, 'status' | 'alert'> = {
  success: 'status',
  info: 'status',
  warning: 'alert',
  danger: 'alert',
};

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: VariantAlert;
  /** Titre optionnel. Si absent, seul le `children` est affiché. */
  titre?: string;
  children: ReactNode;
}

/**
 * Message d'alerte inline.
 *
 * Le rôle ARIA est `status` (succès / info) ou `alert` (warning / danger),
 * pour qu'un lecteur d'écran annonce automatiquement l'apparition.
 */
export function Alert({ variant = 'info', titre, children, className, ...props }: AlertProps) {
  const Icone = ICONES_VARIANT[variant];
  return (
    <div
      role={ROLES_VARIANT[variant]}
      className={cn(
        'flex gap-3 rounded-md border bg-surface p-4',
        STYLES_VARIANT[variant],
        className,
      )}
      {...props}
    >
      <Icone size={20} strokeWidth={1.75} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="flex flex-col gap-1 text-sm leading-normal">
        {titre !== undefined ? <p className="font-bold">{titre}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
