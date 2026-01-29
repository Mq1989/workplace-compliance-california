import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { SUBSCRIPTION_PLANS } from "@/constants";
import {
  Shield,
  FileText,
  Users,
  ClipboardList,
  Bell,
  Download,
  Check,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "WVPP Generator",
    description:
      "Guided wizard builds a fully compliant Workplace Violence Prevention Plan customized to your industry and workplace.",
  },
  {
    icon: ClipboardList,
    title: "Incident Log",
    description:
      "Digital violent incident log that meets all Cal/OSHA requirements. No personally identifying information stored.",
  },
  {
    icon: Users,
    title: "Training Tracking",
    description:
      "Track employee training completion dates, send reminders, and maintain records required by LC 6401.9.",
  },
  {
    icon: Bell,
    title: "Automated Reminders",
    description:
      "Get notified before annual plan reviews and employee training deadlines so you never miss a compliance date.",
  },
  {
    icon: Download,
    title: "PDF Exports",
    description:
      "Generate audit-ready PDF documents of your WVPP, incident logs, and training records at any time.",
  },
  {
    icon: Shield,
    title: "Compliance Dashboard",
    description:
      "See your compliance status at a glance with a real-time score based on plan, training, and incident log status.",
  },
];

const planOrder = ["starter", "professional", "enterprise"];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg">SafeWorkCA</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            California SB 553 Compliance
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Workplace Violence Prevention Made Simple
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            SafeWorkCA helps California employers comply with Labor Code Section
            6401.9. Generate your Workplace Violence Prevention Plan, track
            employee training, and maintain incident logs — all in one platform.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">See How It Works</a>
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            14-day free trial. No credit card required.
          </p>
        </div>
      </section>

      {/* Penalty Callout */}
      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-8 text-center sm:grid-cols-3">
            <div>
              <p className="text-3xl font-bold">900,000+</p>
              <p className="mt-1 text-sm text-muted-foreground">
                California employers required to comply
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold">$25,000</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Minimum penalty for serious violations
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold">$158,727</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Maximum penalty for willful violations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything You Need to Stay Compliant
          </h2>
          <p className="mt-4 text-muted-foreground">
            SafeWorkCA covers every requirement of California Labor Code Section
            6401.9 so you can focus on running your business.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="border-border">
                <CardHeader>
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              Start with a free 14-day trial. Upgrade when you are ready.
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {planOrder.map((key) => {
              const plan = SUBSCRIPTION_PLANS[key];
              const isPopular = key === "professional";
              return (
                <Card
                  key={key}
                  className={
                    isPopular
                      ? "relative border-2 border-primary shadow-lg"
                      : "border-border"
                  }
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm"
                        >
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPopular ? "default" : "outline"}
                      asChild
                    >
                      <Link href="/sign-up">Start Free Trial</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-center sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <dl className="mt-12 space-y-8">
            {[
              {
                q: "What is SB 553 and does it apply to my business?",
                a: "SB 553 (Labor Code Section 6401.9) requires nearly all California employers to establish, implement, and maintain a written Workplace Violence Prevention Plan. It took effect July 1, 2024. Healthcare facilities covered by CCR Title 8, Section 3342 are exempt.",
              },
              {
                q: "What are the penalties for non-compliance?",
                a: "Cal/OSHA can issue citations ranging from $25,000 for serious violations up to $158,727 for willful violations. Employers must also maintain records for 5 years and provide annual employee training.",
              },
              {
                q: "How long does it take to create a plan?",
                a: "Our guided wizard walks you through each required section. Most employers complete their initial plan in a single session. You can save your progress and return at any time.",
              },
              {
                q: "Can I try SafeWorkCA before paying?",
                a: "Yes. Every account starts with a free 14-day trial that includes all Professional plan features. No credit card is required to sign up.",
              },
            ].map((item) => (
              <div key={item.q}>
                <dt className="text-base font-semibold">{item.q}</dt>
                <dd className="mt-2 text-sm leading-6 text-muted-foreground">
                  {item.a}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Get Compliant Today
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of California employers using SafeWorkCA to meet
            their SB 553 obligations. Start your free trial now.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/sign-up">
                Start Free Trial <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>SafeWorkCA</span>
            </div>
            <p className="max-w-md text-center text-xs text-muted-foreground sm:text-right">
              SafeWorkCA provides tools to help employers create workplace
              violence prevention plans. Use of this platform does not guarantee
              compliance with California Labor Code Section 6401.9. Employers
              are responsible for ensuring their plans meet all legal
              requirements. This platform does not provide legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
