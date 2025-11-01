"use client";

import { motion } from "framer-motion";


export default function PrivacyPolicyPage() {
  return (
    <main className="bg-background text-foreground py-20 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-bold mb-4 text-[#FFCE00]"
        >
          🔒 Privacy Policy for Signature Trader
        </motion.h1>

        <p className="text-gray-400 text-sm mb-10 italic">
          Effective Date:{" "}
          <span className="text-[#FFCE00] font-medium">October 26, 2025</span>
        </p>

        {/* Intro */}
        <p className="mb-8 leading-relaxed text-gray-300">
          This Privacy Policy describes how{" "}
          <strong>Signature Trader</strong> ("the Site," "we," "us," or "our")
          collects, uses, and discloses your Personal Information when you visit
          or make a purchase from{" "}
          <a
            href="https://www.signaturetrader.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFCE00] underline hover:opacity-80"
          >
            www.signaturetrader.com
          </a>
          .
        </p>

        {/* Section 1 */}
        <SectionTitle>1. The Personal Information We Collect</SectionTitle>
        <p className="mb-4">
          We collect various types of Personal Information to fulfill your
          orders, provide customer support, and improve your shopping
          experience.
        </p>

        <div className="overflow-x-auto mb-8">
          <table className="min-w-full border border-gray-700 text-sm">
            <thead className="bg-[#FFCE00] text-black">
              <tr>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Examples</th>
                <th className="px-4 py-2 text-left">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <TableRow
                type="Order Information"
                examples="Name, address, email, phone, payment info"
                purpose="To process orders, deliver items, and prevent fraud."
              />
              <TableRow
                type="Device Information"
                examples="IP address, browser type, time zone, cookies"
                purpose="To prevent risk and improve website performance."
              />
              <TableRow
                type="Voluntary Information"
                examples="Reviews, surveys, support messages"
                purpose="To provide customer support and marketing (if opted-in)."
              />
            </tbody>
          </table>
        </div>

        {/* Section 2 */}
        <SectionTitle>2. How We Use Your Personal Information</SectionTitle>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>To process and deliver your orders.</li>
          <li>To communicate about orders or account updates.</li>
          <li>
            To send marketing emails or offers (only if you opted in).
          </li>
          <li>To improve the Site’s functionality and user experience.</li>
        </ul>

        {/* Section 3 */}
        <SectionTitle>3. Sharing Your Personal Information</SectionTitle>
        <p className="mb-4">
          We may share your information with trusted third parties:
        </p>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>
            <strong>Service Providers:</strong> e.g., Stripe, PayPal, and
            shipping partners.
          </li>
          <li>
            <strong>Analytics:</strong>{" "}
            <a
              href="https://policies.google.com/privacy"
              className="text-[#FFCE00] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Analytics
            </a>{" "}
            helps us understand user behavior.
          </li>
          <li>
            <strong>Legal Requirements:</strong> To comply with applicable laws
            or protect our rights.
          </li>
        </ul>

        {/* Section 4 */}
        <SectionTitle>4. Behavioral Advertising</SectionTitle>
        <p className="mb-4">
          We may use your Personal Information to provide targeted advertising.
          You can opt out below:
        </p>
        <ul className="list-disc pl-6 mb-8 space-y-2">
          <li>
            Facebook:{" "}
            <a
              href="https://www.facebook.com/settings/?tab=ads"
              className="text-[#FFCE00] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              facebook.com/settings/?tab=ads
            </a>
          </li>
          <li>
            Google:{" "}
            <a
              href="https://www.google.com/settings/ads/anonymous"
              className="text-[#FFCE00] underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              google.com/settings/ads/anonymous
            </a>
          </li>
        </ul>

        {/* Section 5 */}
        <SectionTitle>5. Your Rights (GDPR / CCPA)</SectionTitle>
        <p className="mb-8">
          Depending on your location, you may have the right to access, correct,
          or delete your data. Contact us to exercise these rights. We retain
          Order Information unless you request deletion.
        </p>

        {/* Section 6 */}
        <SectionTitle>6. Data Security and Retention</SectionTitle>
        <p className="mb-8">
          We apply reasonable security measures, but no online method is
          entirely secure. Data is retained as required by law or for business
          needs.
        </p>

        {/* Section 7 */}
        <SectionTitle>7. Changes to This Policy</SectionTitle>
        <p className="mb-8">
          This Privacy Policy may be updated periodically. The latest version
          will always appear on this page.
        </p>

        {/* Section 8 */}
        <SectionTitle>8. Contact Us</SectionTitle>
        <p className="mb-8">
          For questions, contact us at{" "}
          <span className="text-[#FFCE00] font-semibold">
            support@signaturetrader.com
          </span>{" "}
          or by mail:
          <br />
          <strong>Signature Trader</strong>
          <br />
          Lahore, Pakistan
        </p>

        <hr className="border-gray-700 my-8" />
      </div>
    </main>
  );
}

// ===== Subcomponents for cleaner JSX =====
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-2xl font-semibold mb-4 text-[#FFCE00]">{children}</h2>
  );
}

function TableRow({
  type,
  examples,
  purpose,
}: {
  type: string;
  examples: string;
  purpose: string;
}) {
  return (
    <tr className="border-t border-gray-700">
      <td className="px-4 py-3 font-medium">{type}</td>
      <td className="px-4 py-3">{examples}</td>
      <td className="px-4 py-3">{purpose}</td>
    </tr>
  );
}
