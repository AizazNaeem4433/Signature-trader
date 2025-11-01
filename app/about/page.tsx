"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-background text-foreground">
            {/* Section 1 - Intro */}
            <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                        Welcome to{" "}
                        <span className="text-[#FFE802]">Signature Trader</span>
                    </h1>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        At Signature Trader, we believe that true style and comfort are
                        found in the details of everyday living. Born from a passion for
                        exceptional design and lasting quality, we curate a distinctive
                        collection of products that elevate your home and personal lifestyle.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="flex justify-center items-center rounded-2xl overflow-hidden shadow-xl bg-card"
                >
                    <Image
                        src="/about/lifestyle.png"
                        alt="Signature lifestyle"
                        width={900}
                        height={1200}
                        className="w-full h-auto object-contain"
                    />
                </motion.div>

            </section>

            {/* Section 2 - Philosophy */}
            <section className="max-w-6xl mx-auto px-6 py-20 text-center space-y-8">
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-semibold"
                >
                    Our Philosophy
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="max-w-3xl mx-auto text-lg text-muted-foreground leading-relaxed"
                >
                    We are more than just a retailer; we are a dedicated partner in helping
                    you discover products that resonate with your unique taste. Our
                    commitment extends beyond the transaction—we aim to inspire a lifestyle
                    where every choice reflects quality, durability, and a touch of
                    signature sophistication.
                </motion.p>
            </section>

            {/* Section 3 - Why Choose Us */}
            <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {[
                    {
                        title: "Curated Selection",
                        text: "Hand-picked items that meet rigorous standards for quality and design.",
                    },
                    {
                        title: "Diverse Range",
                        text: "A comprehensive collection catering to various aspects of modern living.",
                    },
                    {
                        title: "Customer-Centric",
                        text: "A focus on your satisfaction, ensuring a seamless shopping experience.",
                    },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.2 }}
                        viewport={{ once: true }}
                        className="bg-card border border-border p-8 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                        <h3 className="text-2xl font-semibold mb-3 text-[#FFE802] drop-shadow-[0_2px_4px_rgba(0,0,0.6,0)]">
                            {item.title}
                        </h3>
                        <p className="text-muted-foreground">{item.text}</p>
                    </motion.div>
                ))}
            </section>

            {/* Section 4 - Product Imagery */}
            <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-8 auto-rows-auto">
                {["/about/product1.jpg", "/about/product2.png", "/about/decor.png"].map((src, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: i * 0.2 }}
                        viewport={{ once: true }}
                        className="rounded-2xl overflow-hidden shadow-lg flex justify-center items-center bg-card"
                    >
                        <Image
                            src={src}
                            alt={`Product ${i + 1}`}
                            width={800}
                            height={1000}
                            className="w-full h-auto object-contain hover:scale-105 transition-transform duration-500"
                        />
                    </motion.div>
                ))}
            </section>


            {/* Section 5 - Closing */}
            <section className="max-w-4xl mx-auto px-6 pb-24 text-center space-y-6">
                <motion.h3
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="text-3xl font-semibold"
                >
                    Join the Signature Trader Family
                </motion.h3>
                <p className="text-lg text-muted-foreground">
                    Discover how effortless it is to infuse your world with quality,
                    comfort, and undeniable style. <br />
                    <span className="text-[#FFE802] font-medium">Live with Signature.</span>
                </p>
            </section>
        </main>
    );
}
