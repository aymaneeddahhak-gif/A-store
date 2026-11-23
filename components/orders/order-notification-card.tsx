'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';

export type OrderStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered' | 'In Transit';

export interface StatusConfig {
  key: OrderStatus;
  label: string;
  messageText: string;
  subText: string;
  pillClass: string;
  btnClass: string;
}

export const STATUS_CONFIGS: Record<OrderStatus, StatusConfig> = {
  Confirmed: {
    key: 'Confirmed',
    label: 'Order Confirmed',
    messageText: 'Order Confirmed',
    subText: 'Everything seems great',
    pillClass: 'bg-emerald-500/12 text-emerald-600 border-emerald-500/35',
    btnClass: 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-600 hover:text-white',
  },
  Pending: {
    key: 'Pending',
    label: 'Pending',
    messageText: 'Order Pending',
    subText: 'Awaiting merchant approval',
    pillClass: 'bg-amber-500/12 text-amber-600 border-amber-500/35',
    btnClass: 'border-amber-500/40 text-amber-600 hover:bg-amber-500 hover:text-black',
  },
  Cancelled: {
    key: 'Cancelled',
    label: 'Cancel Order',
    messageText: 'Order Cancelled',
    subText: 'Refund issued to original payment',
    pillClass: 'bg-rose-500/12 text-rose-600 border-rose-500/35',
    btnClass: 'border-rose-500/40 text-rose-600 hover:bg-rose-600 hover:text-white',
  },
  Shipped: {
    key: 'Shipped',
    label: 'Shipped',
    messageText: 'Package Shipped',
    subText: 'Carrier picked up your order',
    pillClass: 'bg-blue-500/12 text-blue-600 border-blue-500/35',
    btnClass: 'border-blue-500/40 text-blue-600 hover:bg-blue-600 hover:text-white',
  },
  Delivered: {
    key: 'Delivered',
    label: 'Delivered',
    messageText: 'Package Delivered',
    subText: 'Package arrived safely at front door',
    pillClass: 'bg-zinc-900/10 text-zinc-800 border-zinc-500/35',
    btnClass: 'border-zinc-500/40 text-zinc-800 hover:bg-zinc-900 hover:text-white',
  },
  'In Transit': {
    key: 'In Transit',
    label: 'In Transit',
    messageText: 'In Transit',
    subText: 'Moving to nearest delivery hub',
    pillClass: 'bg-blue-500/12 text-blue-600 border-blue-500/35',
    btnClass: 'border-blue-500/40 text-blue-600 hover:bg-blue-600 hover:text-white',
  },
};

interface OrderNotificationCardProps {
  status?: OrderStatus;
  onStatusClick?: (status: OrderStatus) => void;
  onDismiss?: () => void;
}

/**
 * Clean minimal order status banner (no left circular icon disc or wave).
 * Paired with Option 1 Editorial Hairline action button.
 */
export default function OrderNotificationCard({
  status = 'Confirmed',
  onStatusClick,
  onDismiss,
}: OrderNotificationCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const cfg = STATUS_CONFIGS[status] || STATUS_CONFIGS.Confirmed;

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => setDismissed(false)}
        className="text-xs text-gray-500 hover:text-gray-900 underline font-medium cursor-pointer"
      >
        Restore Notification
      </button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      <div className="w-[330px] max-w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xs flex items-start gap-2.5">
        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-tight truncate">{cfg.messageText}</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{cfg.subText}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            onDismiss?.();
          }}
          aria-label="Dismiss notification"
          className="text-gray-400 hover:text-gray-700 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" aria-hidden />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onStatusClick?.(status)}
        className={`inline-flex items-center justify-center font-semibold px-4 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${cfg.btnClass}`}
      >
        <span>{cfg.label}</span>
      </button>
    </div>
  );
}
