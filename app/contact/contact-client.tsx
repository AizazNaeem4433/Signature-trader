"use client";

import { motion } from "framer-motion";
import { useState } from "react";

// --- FIX: Component ka naam "ContactPage" se "ContactClient" kar dein ---
export default function ContactClient() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("idle");

    try {
      console.log("Form submitted:", form);
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-20 text-foreground">
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-4xl font-bold mb-12 text-[#FFCE00]"
      >
        📧 Contact Signature Trader
      </motion.h1>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* LEFT SIDE — INFO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <p className="text-lg leading-relaxed">
            We&apos;re here to help! Whether you have a question about an order,
            need assistance choosing the perfect cutlery set, or want to know
            more about our latest home appliances — our team is ready to assist.
          </p>

          {/* Department Info */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-[#FFCE00]">
              Department Contacts
            </h2>
            <ul className="space-y-3">
              <li>
                <strong>Customer Support:</strong>{" "}
                <a
                  href="mailto:signaturetrader6@gmail.com"
                  className="text-[#FFCE00] underline"
                >
                  support@signaturetrader.com
                </a>{" "}
                — for order, shipping, or return inquiries.
              </li>
              <li>
                <strong>Sales & Business:</strong>{" "}
                <a
                  href="mailto:sales@signaturetrader.com"
                  className="text-[#FFCE00] underline"
                >
                  sales@signaturetrader.com
                </a>{" "}
                — for bulk orders or partnerships.
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-[#FFCE00]">
              Follow Us
            </h2>
            <ul className="space-y-2">
              <li>
                Instagram:{" "}
                <a
                  href="https://www.instagram.com/signatu_cutlery_crockery_store/?utm_source=qr&igsh=MTljYXZ3aGh2Mm05cQ%3D%3D#"
                  target="_blank"
                  className="underline hover:text-[#FFCE00]"
                >
                  @SignatureTrader_Official
                </a>
              </li>
              <li>
                Facebook:{" "}
                <a
                  href="https://www.facebook.com/Signature.Traders.2026?rdid=iqqnhUyFt42wPuhZ&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F16XR4UjW4C%2F#"
                  target="_blank"
                  className="underline hover:text-[#FFCE00]"
                >
                  /SignatureTraderOfficial
                </a>
              </li>
              {/* <li>
                Pinterest:{" "}
                <a
                  href="https://pinterest.com/SignatureTrader"
                  target="_blank"
                  className="underline hover:text-[#FFCE00]"
                >
                  /SignatureTrader
                </a>
              </li> */}
            </ul>
          </div>

          {/* Mailing Info */}
          <div>
            <h2 className="text-2xl font-semibold mb-3 text-[#FFCE00]">
              Official Mailing Address
            </h2>
            <p>
              Signature Trader
              <br />
              [Insert full street address here]
              <br />
              Wazirabad, Pakistan
            </p>
            <p className="mt-3">
              📞 <strong>Phone:</strong> [+92 307 5221171]
              <br />
              🕘 <strong>Hours:</strong> Mon – Fri, 9:00 AM – 5:00 PM PKT
            </p>
          </div>
        </motion.div>

        {/* RIGHT SIDE — FORM */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-muted/50 rounded-2xl p-8 shadow-lg sticky top-28"
        >
          <h2 className="text-2xl font-semibold mb-4 text-[#FFCE00]">
            Send Us a Message
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 font-medium">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-[#FFCE00]"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-[#FFCE00]"
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-3 rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-[#FFCE00]"
              ></textarea>
            </div>

            <button
              type="submit"
              className="bg-[#FFCE00] text-black px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-all w-full"
            >
              Send Message
            </button>

            {status === "success" && (
              <p className="text-green-500 font-medium pt-3">
                ✅ Message sent successfully! We’ll get back to you soon.
              </p>
            )}
            {status === "error" && (
              <p className="text-red-500 font-medium pt-3">
                ❌ Something went wrong. Please try again.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}