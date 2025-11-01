"use client";

import { motion } from "framer-motion";

export default function TermsPage() {
  return (
    <section className="max-w-5xl mx-auto px-6 py-20 text-foreground">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold mb-8 text-[#FFCE00]"
      >
        📜 Terms & Conditions of Sale and Use
      </motion.h1>

      <p className="text-sm mb-8 italic">Effective Date: October 26, 2025</p>

      <div className="space-y-6 leading-relaxed">
        <p>
          Welcome to <strong>Signature Trader</strong> (www.signaturetrader.com).
          These Terms and Conditions ("Terms") govern your use of the Site and
          your purchase of any products offered by us, including but not limited
          to cutlery, shoes, clothes, home appliances, and fans.
        </p>

        <p>
          By accessing or using the Site, you agree to be bound by these Terms.
          If you do not agree with any part of the Terms, you must not use the
          Site.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          1. General Conditions and Account Terms
        </h2>
        <p>
          1.1. Eligibility: By agreeing to these Terms, you represent that you
          are at least the age of majority in your jurisdiction or have consent
          from a guardian.
        </p>
        <p>
          1.2. User Account: You are responsible for maintaining the
          confidentiality of your account information. We reserve the right to
          refuse service or terminate accounts at our discretion.
        </p>
        <p>
          1.3. Accuracy of Information: We are not responsible if information on
          this site is not accurate, complete, or current. Any reliance is at
          your own risk.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          2. Products and Orders
        </h2>
        <p>
          2.1. Product Descriptions: We strive for accuracy but do not guarantee
          all product details or colors will be error-free.
        </p>
        <p>
          2.2. Pricing and Payment: Prices are subject to change. You agree to
          provide accurate billing and purchase information.
        </p>
        <p>
          2.3. Order Acceptance: We reserve the right to limit or cancel orders
          per person or household.
        </p>
        <p>
          2.4. Shipping: Delivery times are estimates only; we are not liable
          for delays caused by courier services.
        </p>
        <p>
          2.5. Returns: See our Return Policy linked in the footer for details.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          3. Intellectual Property Rights (IP)
        </h2>
        <p>
          All content on this site—including the Signature Trader name, logo,
          text, images, and software—is protected by copyright and trademark
          laws.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          4. Prohibited Uses
        </h2>
        <p>
          You may not use the site for unlawful purposes, infringe intellectual
          property rights, transmit malware, or engage in spamming or phishing.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          5. Disclaimer of Warranties; Limitation of Liability
        </h2>
        <p>
          The products and services are provided “as is” without any warranties.
          Signature Trader shall not be liable for any damages arising from your
          use of the service or products.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          6. Governing Law and Dispute Resolution
        </h2>
        <p>
          These Terms are governed by the laws of Pakistan. Any disputes shall
          be resolved in the courts of Lahore, Pakistan.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          7. Termination
        </h2>
        <p>
          You may terminate these Terms anytime by ceasing site use. We may
          terminate this agreement without notice if you violate any provision.
        </p>

        <h2 className="text-2xl font-semibold mt-10 text-[#FFCE00]">
          8. Contact Information
        </h2>
        <p>
          Questions about these Terms should be sent to{" "}
          <a
            href="mailto:support@signaturetrader.com"
            className="text-[#FFCE00] underline hover:opacity-80"
          >
            support@signaturetrader.com
          </a>
          .
        </p>
      </div>
    </section>
  );
}
