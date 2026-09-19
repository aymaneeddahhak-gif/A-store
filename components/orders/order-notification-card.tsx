'use client';

import React, { useState, CSSProperties } from 'react';

// Order Status Presets
export type OrderStatus = 'Confirmed' | 'Pending' | 'Cancelled' | 'Shipped' | 'Delivered' | 'In Transit';

export interface StatusConfig {
  key: OrderStatus;
  label: string;
  messageText: string;
  subText: string;
  btnBg: string;
  glowColor: string;
  waveFill: string;
  iconBg: string;
  textColor: string;
}

export const STATUS_CONFIGS: Record<OrderStatus, StatusConfig> = {
  Confirmed: {
    key: 'Confirmed',
    label: 'Order Confirmed',
    messageText: 'Order Confirmed',
    subText: 'Everything seems great',
    btnBg: '#00ffaa',
    glowColor: 'rgba(0, 255, 170, 0.45)',
    waveFill: '#00ffaa3a',
    iconBg: '#00ffaa48',
    textColor: '#059669',
  },
  Pending: {
    key: 'Pending',
    label: 'Pending',
    messageText: 'Order Pending',
    subText: 'Awaiting merchant approval',
    btnBg: '#ffaa00',
    glowColor: 'rgba(255, 170, 0, 0.45)',
    waveFill: '#ffaa003a',
    iconBg: '#ffaa0048',
    textColor: '#d97706',
  },
  Cancelled: {
    key: 'Cancelled',
    label: 'Cancel Order',
    messageText: 'Order Cancelled',
    subText: 'Refund issued to original payment',
    btnBg: '#ff4d4f',
    glowColor: 'rgba(255, 77, 79, 0.45)',
    waveFill: '#ff4d4f3a',
    iconBg: '#ff4d4f48',
    textColor: '#dc2626',
  },
  Shipped: {
    key: 'Shipped',
    label: 'Shipped',
    messageText: 'Package Shipped',
    subText: 'Carrier picked up your order',
    btnBg: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.45)',
    waveFill: '#c084fc3a',
    iconBg: '#c084fc48',
    textColor: '#9333ea',
  },
  Delivered: {
    key: 'Delivered',
    label: 'Delivered',
    messageText: 'Package Delivered',
    subText: 'Package arrived safely at front door',
    btnBg: '#66ff66',
    glowColor: 'rgba(102, 255, 102, 0.45)',
    waveFill: '#04e4003a',
    iconBg: '#04e40048',
    textColor: '#269b24',
  },
  'In Transit': {
    key: 'In Transit',
    label: 'In Transit',
    messageText: 'In Transit',
    subText: 'Moving to nearest delivery hub',
    btnBg: '#ffd000',
    glowColor: 'rgba(255, 208, 0, 0.45)',
    waveFill: '#ffd0003a',
    iconBg: '#ffd00048',
    textColor: '#ca8a04',
  },
};

interface OrderNotificationCardProps {
  status?: OrderStatus;
  onStatusClick?: (status: OrderStatus) => void;
  onDismiss?: () => void;
}

/**
 * Uiverse.io Notification Card (by akshat-patel28)
 * + Green Card Pill Button (no hover swap)
 */
export default function OrderNotificationCard({
  status = 'Confirmed',
  onStatusClick,
  onDismiss,
}: OrderNotificationCardProps) {
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(status);
  void setCurrentStatus;
  const [dismissed, setDismissed] = useState(false);

  const cfg = STATUS_CONFIGS[currentStatus] || STATUS_CONFIGS.Confirmed;

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
      {/* Exact Uiverse Card */}
      <div
        className="uiverse-card"
        style={
          {
            '--wave-fill': cfg.waveFill,
            '--icon-bg': cfg.iconBg,
            '--icon-color': cfg.textColor,
            '--text-color': cfg.textColor,
          } as CSSProperties
        }
      >
        <svg className="uiverse-wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0,256L11.4,240C22.9,224,46,192,69,192C91.4,192,114,224,137,234.7C160,245,183,235,206,213.3C228.6,192,251,160,274,149.3C297.1,139,320,149,343,181.3C365.7,213,389,267,411,282.7C434.3,299,457,277,480,250.7C502.9,224,526,192,549,181.3C571.4,171,594,181,617,208C640,235,663,277,686,256C708.6,235,731,149,754,122.7C777.1,96,800,128,823,165.3C845.7,203,869,245,891,224C914.3,203,937,117,960,112C982.9,107,1006,181,1029,197.3C1051.4,213,1074,171,1097,144C1120,117,1143,107,1166,133.3C1188.6,160,1211,224,1234,218.7C1257.1,213,1280,139,1303,133.3C1325.7,128,1349,192,1371,192C1394.3,192,1417,128,1429,96L1440,64L1440,320L1428.6,320C1417.1,320,1394,320,1371,320C1348.6,320,1326,320,1303,320C1280,320,1257,320,1234,320C1211.4,320,1189,320,1166,320C1142.9,320,1120,320,1097,320C1074.3,320,1051,320,1029,320C1005.7,320,983,320,960,320C937.1,320,914,320,891,320C868.6,320,846,320,823,320C800,320,777,320,754,320C731.4,320,709,320,686,320C662.9,320,640,320,617,320C594.3,320,571,320,549,320C525.7,320,503,320,480,320C457.1,320,434,320,411,320C388.6,320,366,320,343,320C320,320,297,320,274,320C251.4,320,229,320,206,320C182.9,320,160,320,137,320C114.3,320,91,320,69,320C45.7,320,23,320,11,320L0,320Z"
            fillOpacity="1"
          />
        </svg>

        <div className="uiverse-icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="uiverse-icon">
            <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
          </svg>
        </div>

        <div className="uiverse-message-container">
          <p className="uiverse-message-text">{cfg.messageText}</p>
          <p className="uiverse-sub-text">{cfg.subText}</p>
        </div>

        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 15 15"
          fill="none"
          stroke="currentColor"
          className="uiverse-cross-icon"
          onClick={() => {
            setDismissed(true);
            if (onDismiss) onDismiss();
          }}
        >
          <path
            fill="currentColor"
            d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
            clipRule="evenodd"
            fillRule="evenodd"
          />
        </svg>
      </div>

      {/* Pill Status Button (Green Card Mode - No Hover Swap) */}
      <button
        type="button"
        onClick={() => {
          if (onStatusClick) onStatusClick(currentStatus);
        }}
        style={{
          borderRadius: '500px',
          backgroundColor: cfg.btnBg,
          letterSpacing: '0.05rem',
          boxShadow: `0 2px 12px ${cfg.glowColor}`,
        }}
        className="relative inline-flex items-center justify-center font-bold px-5 py-2 text-black overflow-hidden outline-none border-0 select-none text-sm cursor-pointer transition-all active:scale-95 hover:opacity-95"
      >
        <span>{cfg.label}</span>
      </button>

      {/* Embedded CSS */}
      <style jsx global>{`
        .uiverse-card {
          width: 330px;
          height: 80px;
          border-radius: 8px;
          box-sizing: border-box;
          padding: 10px 15px;
          background-color: #ffffff;
          box-shadow: rgba(149, 157, 165, 0.2) 0px 8px 24px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: space-around;
          gap: 15px;
        }
        .uiverse-wave {
          position: absolute;
          transform: rotate(90deg);
          left: -31px;
          top: 32px;
          width: 80px;
          fill: var(--wave-fill, #04e4003a);
        }
        .uiverse-icon-container {
          width: 35px;
          height: 35px;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--icon-bg, #04e40048);
          border-radius: 50%;
          margin-left: 8px;
          flex-shrink: 0;
        }
        .uiverse-icon {
          width: 17px;
          height: 17px;
          color: var(--icon-color, #269b24);
        }
        .uiverse-message-container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          flex-grow: 1;
        }
        .uiverse-message-text {
          margin: 0;
          color: var(--text-color, #269b24);
          font-size: 17px;
          font-weight: 700;
          line-height: 1.2;
        }
        .uiverse-sub-text {
          margin: 2px 0 0 0;
          font-size: 14px;
          color: #555;
          line-height: 1.2;
        }
        .uiverse-cross-icon {
          width: 18px;
          height: 18px;
          color: #555;
          cursor: pointer;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
