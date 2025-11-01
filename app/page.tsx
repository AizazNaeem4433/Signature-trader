import Hero from "@/components/HeroSection";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">

      {/* Hero Section */}
      <Hero />

      {/* Placeholder for upcoming sections */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center text-gray-500">
        <p>More sections coming soon...</p>
      </section>
    </main>
  );
}
