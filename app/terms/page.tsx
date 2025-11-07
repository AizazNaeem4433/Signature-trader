// signature-trader/app/terms/page.tsx

import { Metadata } from 'next';
import TermsClient from './terms-client'; // <-- Naye client component ko import karein

// --- YEH HAI STATIC METADATA ---
export const metadata: Metadata = {
  title: 'Terms & Conditions | Signature Trader',
  description: 'Read the Terms & Conditions for using www.signaturetrader.com. Learn about account terms, product orders, liability, and governing laws.',
  openGraph: {
    title: 'Terms & Conditions | Signature Trader',
    description: 'Review our terms of sale and use.',
  },
};
// --- METADATA END ---

// Yeh Server Component hai jo Client Component ko render karta hai
export default function TermsPage() {
  return <TermsClient />;
}