"use client";

import nextDynamic from 'next/dynamic';
import Image from 'next/image';
import { Suspense } from 'react';
import { Header, HeroSection, HeroHighlightSection, StickyScrollRevealDemo } from '@/components/layout';
import { StickyFooter } from "@/components/ui/sticky-footer";

// Loading skeleton for heavy sections
const SectionSkeleton = ({ height = "h-[500px]" }: { height?: string }) => (
  <div className={`${height} w-full flex items-center justify-center bg-black`}>
    <div className="w-8 h-8 border-2 border-zinc-500 border-t-white rounded-full animate-spin" />
  </div>
);

// Dynamic imports with loading states for heavy components
const FeaturesSectionDemo = nextDynamic(
  () => import("@/components/ui/features-section-demo-3"),
  {
    loading: () => <SectionSkeleton height="h-[600px]" />,
    ssr: true,
  }
);

const AnimatedTestimonialsDemo = nextDynamic(
  () => import("@/components/ui/animated-testimonials-demo"),
  {
    loading: () => <SectionSkeleton height="h-[400px]" />,
    ssr: false, // Disable SSR for client-only animations
  }
);

const SplineSceneDemo = nextDynamic(
  () => import("@/components/ui/spline-scene-demo").then(mod => ({ default: mod.SplineSceneDemo })),
  {
    loading: () => <SectionSkeleton />,
    ssr: false, // Spline is client-only
  }
);

const TextHoverEffect = nextDynamic(
  () => import("@/components/ui/text-hover-effect").then(mod => ({ default: mod.TextHoverEffect })),
  {
    loading: () => <SectionSkeleton height="h-[20rem]" />,
    ssr: false,
  }
);

const AnimatedGlassyPricing = nextDynamic(
  () => import("@/components/ui/animated-glassy-pricing").then(mod => ({ default: mod.AnimatedGlassyPricing })),
  {
    loading: () => (
      <div className="h-[600px] w-full flex items-center justify-center bg-black rounded-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-black to-cyan-900/20" />
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
          <span className="text-zinc-500 text-sm">Loading pricing...</span>
        </div>
      </div>
    ),
    ssr: false, // WebGL is client-only
  }
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black dark:bg-black">
      <Header />

      {/* Hero Section with Infinite Grid + Integrated Dashboard Preview */}
      <HeroSection />

      {/* Text Highlight Section */}
      <HeroHighlightSection
        text="Enough Building, time for"
        highlightedText="redemption."
      />

      {/* Interactive 3D Spline Scene - Lazy loaded */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <Suspense fallback={<SectionSkeleton />}>
          <SplineSceneDemo />
        </Suspense>
      </section>

      {/* Sticky Scroll Features Section */}
      <StickyScrollRevealDemo />

      {/* Features Section - Contains heavy Globe component */}
      <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
        <FeaturesSectionDemo />
      </Suspense>

      {/* PROTOCOL ZERO Text Effect */}
      <section className="py-8 flex flex-col items-center justify-center gap-6">
        <Suspense fallback={<SectionSkeleton height="h-[20rem]" />}>
          <TextHoverEffect
            text="PROTOCOL ZERO"
            containerHeight="20rem"
            viewBox="0 0 500 100"
          />
        </Suspense>
        <Image
          src="/ghostfounder.png"
          alt="Protocol Zero Logo"
          width={360}
          height={360}
          className="rounded-2xl shadow-2xl shadow-violet-500/20 animate-float -mt-16"
          style={{
            animation: 'float 3s ease-in-out infinite',
          }}
        />
        <style jsx global>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-35px);
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </section>

      {/* Animated Testimonials Section */}
      <Suspense fallback={<SectionSkeleton height="h-[400px]" />}>
        <AnimatedTestimonialsDemo />
      </Suspense>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<SectionSkeleton height="h-[600px]" />}>
            <AnimatedGlassyPricing
              plans={[
                {
                  planName: 'Free',
                  description: 'Best for testing & understanding',
                  price: '0',
                  features: [
                    '3 Code Police Analyses',
                    '1 Pitch Deck Generation',
                    '10 Database Queries',
                    'Community Support',
                  ],
                  buttonText: 'Get Started Free',
                  buttonHref: '/sign-up',
                  buttonVariant: 'secondary',
                },
                {
                  planName: 'Pro',
                  description: 'Perfect for early-stage startups & solo founders',
                  price: '29',
                  features: [
                    'Unlimited Code Police Analyses',
                    'Unlimited Pitch Deck Generations',
                    'Unlimited Database Queries',
                    'Priority AI Processing',
                    'Auto-fix with Pull Requests',
                    'Team Collaboration (5 members)',
                  ],
                  buttonText: 'Subscribe',
                  buttonHref: '/sign-up',
                  isPopular: true,
                  buttonVariant: 'primary',
                },
              ]}
              showAnimatedBackground={true}
            />
          </Suspense>
        </div>
      </section>

      {/* Sticky Footer Reveal */}
      <StickyFooter />
    </div>
  );
}

