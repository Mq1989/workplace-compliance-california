"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Factory, Users, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { INDUSTRIES, WORKPLACE_TYPES } from "@/constants";

const TOTAL_STEPS = 4;

const STEP_META = [
  { title: "Company Info", description: "Tell us about your business", icon: Building2 },
  { title: "Address", description: "Where is your workplace located?", icon: MapPin },
  { title: "Industry", description: "What type of business do you run?", icon: Factory },
  { title: "Workforce", description: "Tell us about your employees", icon: Users },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    dba: "",
    phone: "",
    email: "",
    address: {
      street: "",
      city: "",
      state: "CA",
      zip: "",
    },
    industry: "",
    employeeCount: "",
    workplaceType: [],
  });

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddress(field, value) {
    setFormData((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }

  function toggleWorkplaceType(value) {
    setFormData((prev) => {
      const types = prev.workplaceType.includes(value)
        ? prev.workplaceType.filter((t) => t !== value)
        : [...prev.workplaceType, value];
      return { ...prev, workplaceType: types };
    });
  }

  function validateStep() {
    switch (step) {
      case 0:
        if (!formData.name.trim()) return "Company name is required.";
        if (!formData.phone.trim()) return "Phone number is required.";
        if (!formData.email.trim()) return "Email address is required.";
        return "";
      case 1:
        if (!formData.address.street.trim()) return "Street address is required.";
        if (!formData.address.city.trim()) return "City is required.";
        if (!formData.address.zip.trim()) return "ZIP code is required.";
        return "";
      case 2:
        if (!formData.industry) return "Please select an industry.";
        return "";
      case 3:
        if (!formData.employeeCount || Number(formData.employeeCount) < 1)
          return "Please enter a valid employee count.";
        if (formData.workplaceType.length === 0)
          return "Please select at least one workplace type.";
        return "";
      default:
        return "";
    }
  }

  function handleNext() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit() {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        employeeCount: Number(formData.employeeCount),
      };

      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to create organization");
      }

      router.push("/plans/new");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const StepIcon = STEP_META[step].icon;

  return (
    <div className="mx-auto max-w-2xl py-8">
      {/* Progress header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <Progress value={progress} />

        {/* Step indicators */}
        <div className="flex justify-between">
          {STEP_META.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  if (i < step) {
                    setError("");
                    setStep(i);
                  }
                }}
                className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                  i === step
                    ? "text-primary font-medium"
                    : i < step
                      ? "text-primary/60 cursor-pointer"
                      : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                    i === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i < step
                        ? "border-primary/60 bg-primary/10 text-primary/60"
                        : "border-muted-foreground/30"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span className="hidden sm:block">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <StepIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">{STEP_META[step].title}</CardTitle>
              <CardDescription>{STEP_META[step].description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 0: Company Info */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Company Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Corporation"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dba">DBA (Doing Business As)</Label>
                <Input
                  id="dba"
                  placeholder="Optional"
                  value={formData.dba}
                  onChange={(e) => updateField("dba", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@company.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">
                  Street Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="street"
                  placeholder="123 Main Street"
                  value={formData.address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    placeholder="Los Angeles"
                    value={formData.address.city}
                    onChange={(e) => updateAddress("city", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">
                    ZIP Code <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="zip"
                    placeholder="90001"
                    value={formData.address.zip}
                    onChange={(e) => updateAddress("zip", e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                SB 553 applies to California employers. State is locked to CA.
              </p>
            </div>
          )}

          {/* Step 2: Industry */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Industry <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={(v) => updateField("industry", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                Your industry selection helps pre-populate hazard assessments and
                training recommendations specific to your workplace.
              </p>
            </div>
          )}

          {/* Step 3: Workforce */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employeeCount">
                  Number of Employees <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="employeeCount"
                  type="number"
                  min="1"
                  placeholder="25"
                  value={formData.employeeCount}
                  onChange={(e) => updateField("employeeCount", e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>
                  Workplace Type(s) <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select all that apply to your organization.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {WORKPLACE_TYPES.map((wt) => (
                    <label
                      key={wt.value}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <Checkbox
                        checked={formData.workplaceType.includes(wt.value)}
                        onCheckedChange={() => toggleWorkplaceType(wt.value)}
                      />
                      <span className="text-sm font-medium">{wt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0 || submitting}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating..." : "Complete Setup"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
