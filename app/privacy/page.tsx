// signature-trader/app/privacy/page.tsx

import { Metadata } from 'next';
import PrivacyClient from './privacy-client'; 

// --- YEH HAI STATIC METADATA ---
export const metadata: Metadata = {
  title: 'Privacy Policy | Signature Trader',
  description: 'Read the Privacy Policy for Signature Trader. Learn how we collect, use, and disclose your Personal Information when you visit or make a purchase.',
  openGraph: {
    title: 'Privacy Policy | Signature Trader',
    description: 'Learn how we collect and use your data.',
  },
};

export default function PrivacyPage() {
  return <PrivacyClient />;
}