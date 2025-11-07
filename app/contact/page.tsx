// signature-trader/app/contact/page.tsx

import { Metadata } from 'next';
import ContactClient from './contact-client';

export const metadata: Metadata = {
  title: 'Contact Us | Signature Trader',
  description: 'Get in touch with Signature Trader. Contact our customer support or sales team for help with orders, bulk inquiries, or any questions you may have.',
  openGraph: {
    title: 'Contact Us | Signature Trader',
    description: 'We are here to help! Contact the Signature Trader team.',
  },
};

export default function ContactPage() {
  return <ContactClient />;
}