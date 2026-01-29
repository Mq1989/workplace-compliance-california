"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  VIOLENCE_TYPES,
  INCIDENT_TYPES,
  PERPETRATOR_TYPES,
} from "@/constants";

const TOTAL_STEPS = 6;

const STEP_META = [
  {
    title: "Date, Time & Location",
    description: "When and where did the incident occur?",
  },
  {
    title: "Incident Classification",
    description: "Categorize the type of violence and perpetrator.",
  },
  {
    title: "Description & Circumstances",
    description: "Describe what happened and the surrounding circumstances.",
  },
  {
    title: "Response & Consequences",
    description: "What actions were taken after the incident?",
  },
  {
    title: "Injuries & Medical",
    description: "Were there injuries or need for medical attention?",
  },
  {
    title: "Completed By",
    description: "Who is filing this incident report?",
  },
];

const LOCATION_TYPES = [
  { value: "workplace", label: "Workplace" },
  { value: "parking_lot", label: "Parking Lot" },
  { value: "outside_workplace", label: "Outside Workplace" },
  { value: "other", label: "Other" },
];

const CIRCUMSTANCE_OPTIONS = [
  { key: "usualJobDuties", label: "Employee was performing usual job duties" },
  { key: "poorlyLitArea", label: "Poorly lit area" },
  { key: "rushed", label: "Employee was rushed or working under pressure" },
  { key: "lowStaffing", label: "Low staffing levels" },
  { key: "isolated", label: "Employee was working alone or isolated" },
  { key: "unableToGetHelp", label: "Employee was unable to get help" },
  { key: "communitySetting", label: "Incident occurred in a community setting" },
  { key: "unfamiliarLocation", label: "Unfamiliar location" },
];

const DEFAULT_FORM_DATA = {
  // Step 1: Date, Time & Location
  incidentDate: "",
  incidentTime: "",
  locationType: "",
  locationDescription: "",

  // Step 2: Incident Classification
  workplaceViolenceTypes: [],
  incidentTypes: [],
  perpetratorClassification: "",

  // Step 3: Description & Circumstances
  detailedDescription: "",
  circumstances: {
    usualJobDuties: false,
    poorlyLitArea: false,
    rushed: false,
    lowStaffing: false,
    isolated: false,
    unableToGetHelp: false,
    communitySetting: false,
    unfamiliarLocation: false,
    other: "",
  },

  // Step 4: Response & Consequences
  securityContacted: false,
  securityResponse: "",
  lawEnforcementContacted: false,
  lawEnforcementResponse: "",
  actionsToProtectEmployees: "",

  // Step 5: Injuries & Medical
  injuriesOccurred: false,
  injuriesDescription: "",
  emergencyMedicalContacted: false,
  emergencyResponderType: "",
  emergencyDescription: "",
  calOshaRequired: false,
  calOshaReportedAt: "",
  calOshaRepresentativeName: "",

  // Step 6: Completed By
  completedByName: "",
  completedByTitle: "",
};

function validateStep(step, formData) {
  switch (step) {
    case 1:
      if (!formData.incidentDate) return "Incident date is required.";
      if (!formData.incidentTime) return "Incident time is required.";
      if (!formData.locationType) return "Location type is required.";
      if (!formData.locationDescription.trim())
        return "Location description is required.";
      return null;
    case 2:
      if (formData.workplaceViolenceTypes.length === 0)
        return "Select at least one workplace violence type.";
      if (formData.incidentTypes.length === 0)
        return "Select at least one incident type.";
      if (!formData.perpetratorClassification)
        return "Perpetrator classification is required.";
      return null;
    case 3:
      if (!formData.detailedDescription.trim())
        return "A detailed description of the incident is required.";
      return null;
    case 4:
      return null; // All optional
    case 5:
      return null; // All optional
    case 6:
      if (!formData.completedByName.trim()) return "Your name is required.";
      if (!formData.completedByTitle.trim()) return "Your title is required.";
      return null;
    default:
      return null;
  }
}

export default function IncidentForm({ planId }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  function updateCircumstance(key, value) {
    setFormData((prev) => ({
      ...prev,
      circumstances: { ...prev.circumstances, [key]: value },
    }));
  }

  function toggleArrayValue(field, value) {
    setFormData((prev) => {
      const arr = prev[field];
      const next = arr.includes(value)
        ? arr.filter((v) => v !== value)
        : [...arr, value];
      return { ...prev, [field]: next };
    });
    setError("");
  }

  function handleNext() {
    const validationError = validateStep(step, formData);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }

  function handleBack() {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
  }

  function buildPayload() {
    return {
      planId,
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      location: {
        type: formData.locationType,
        description: formData.locationDescription,
      },
      workplaceViolenceTypes: formData.workplaceViolenceTypes,
      incidentTypes: formData.incidentTypes,
      perpetratorClassification: formData.perpetratorClassification,
      detailedDescription: formData.detailedDescription,
      circumstances: formData.circumstances,
      consequences: {
        securityContacted: formData.securityContacted,
        securityResponse: formData.securityResponse,
        lawEnforcementContacted: formData.lawEnforcementContacted,
        lawEnforcementResponse: formData.lawEnforcementResponse,
        actionsToProtectEmployees: formData.actionsToProtectEmployees,
      },
      injuries: {
        occurred: formData.injuriesOccurred,
        description: formData.injuriesDescription,
      },
      emergencyMedical: {
        contacted: formData.emergencyMedicalContacted,
        responderType: formData.emergencyResponderType,
        description: formData.emergencyDescription,
      },
      calOshaReporting: {
        required: formData.calOshaRequired,
        reportedAt: formData.calOshaReportedAt || undefined,
        representativeName: formData.calOshaRepresentativeName || undefined,
      },
      completedBy: {
        name: formData.completedByName,
        title: formData.completedByTitle,
      },
    };
  }

  async function handleSubmit() {
    const validationError = validateStep(step, formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save incident");
      }

      const incident = await res.json();
      router.push(`/incidents/${incident._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Step {step} of {TOTAL_STEPS}: {STEP_META[step - 1].title}
          </span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />

        {/* Step indicators */}
        <div className="flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i + 1 < step) {
                  setError("");
                  setStep(i + 1);
                }
              }}
              disabled={i + 1 > step}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i + 1 < step
                  ? "bg-primary cursor-pointer"
                  : i + 1 === step
                    ? "bg-primary"
                    : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>{STEP_META[step - 1].title}</CardTitle>
          <CardDescription>{STEP_META[step - 1].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Date, Time & Location */}
          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="incidentDate">
                    Incident Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => updateField("incidentDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="incidentTime">
                    Incident Time <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="incidentTime"
                    type="time"
                    value={formData.incidentTime}
                    onChange={(e) => updateField("incidentTime", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationType">
                  Location Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.locationType}
                  onValueChange={(v) => updateField("locationType", v)}
                >
                  <SelectTrigger id="locationType">
                    <SelectValue placeholder="Select location type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map((lt) => (
                      <SelectItem key={lt.value} value={lt.value}>
                        {lt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationDescription">
                  Location Description{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="locationDescription"
                  value={formData.locationDescription}
                  onChange={(e) =>
                    updateField("locationDescription", e.target.value)
                  }
                  placeholder="Describe the specific location (e.g., front entrance, break room, parking structure level 2)"
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Step 2: Incident Classification */}
          {step === 2 && (
            <>
              <div className="space-y-3">
                <Label>
                  Workplace Violence Type{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select all that apply.
                </p>
                <div className="space-y-3">
                  {VIOLENCE_TYPES.map((vt) => (
                    <div key={vt.value} className="flex items-start gap-3">
                      <Checkbox
                        id={`vt-${vt.value}`}
                        checked={formData.workplaceViolenceTypes.includes(
                          vt.value
                        )}
                        onCheckedChange={() =>
                          toggleArrayValue("workplaceViolenceTypes", vt.value)
                        }
                      />
                      <div className="grid gap-0.5 leading-none">
                        <Label
                          htmlFor={`vt-${vt.value}`}
                          className="font-medium"
                        >
                          {vt.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {vt.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>
                  Incident Type <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select all that apply.
                </p>
                <div className="space-y-2">
                  {INCIDENT_TYPES.map((it) => (
                    <div key={it.value} className="flex items-center gap-3">
                      <Checkbox
                        id={`it-${it.value}`}
                        checked={formData.incidentTypes.includes(it.value)}
                        onCheckedChange={() =>
                          toggleArrayValue("incidentTypes", it.value)
                        }
                      />
                      <Label htmlFor={`it-${it.value}`}>{it.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perpetratorClassification">
                  Perpetrator Classification{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.perpetratorClassification}
                  onValueChange={(v) =>
                    updateField("perpetratorClassification", v)
                  }
                >
                  <SelectTrigger id="perpetratorClassification">
                    <SelectValue placeholder="Select perpetrator type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PERPETRATOR_TYPES.map((pt) => (
                      <SelectItem key={pt.value} value={pt.value}>
                        {pt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Step 3: Description & Circumstances */}
          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="detailedDescription">
                  Detailed Description{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Describe what happened in detail. Do not include any
                  personally identifiable information (names, addresses, SSN,
                  etc.) — this log may be accessible to employees per LC
                  6401.9(d).
                </p>
                <Textarea
                  id="detailedDescription"
                  value={formData.detailedDescription}
                  onChange={(e) =>
                    updateField("detailedDescription", e.target.value)
                  }
                  placeholder="Describe the incident in detail..."
                  rows={6}
                />
              </div>

              <div className="space-y-3">
                <Label>Circumstances at time of incident</Label>
                <p className="text-xs text-muted-foreground">
                  Select all that apply.
                </p>
                <div className="space-y-2">
                  {CIRCUMSTANCE_OPTIONS.map((opt) => (
                    <div key={opt.key} className="flex items-center gap-3">
                      <Checkbox
                        id={`circ-${opt.key}`}
                        checked={formData.circumstances[opt.key]}
                        onCheckedChange={(checked) =>
                          updateCircumstance(opt.key, !!checked)
                        }
                      />
                      <Label htmlFor={`circ-${opt.key}`}>{opt.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="circumstancesOther">
                  Other circumstances (optional)
                </Label>
                <Textarea
                  id="circumstancesOther"
                  value={formData.circumstances.other}
                  onChange={(e) =>
                    updateCircumstance("other", e.target.value)
                  }
                  placeholder="Any other relevant circumstances..."
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Step 4: Response & Consequences */}
          {step === 4 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="securityContacted">
                      Was security contacted?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      On-site security or security service.
                    </p>
                  </div>
                  <Switch
                    id="securityContacted"
                    checked={formData.securityContacted}
                    onCheckedChange={(v) => updateField("securityContacted", v)}
                  />
                </div>
                {formData.securityContacted && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor="securityResponse">
                      Describe security response
                    </Label>
                    <Textarea
                      id="securityResponse"
                      value={formData.securityResponse}
                      onChange={(e) =>
                        updateField("securityResponse", e.target.value)
                      }
                      placeholder="What did security do in response?"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="lawEnforcementContacted">
                      Was law enforcement contacted?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Police, sheriff, or other law enforcement.
                    </p>
                  </div>
                  <Switch
                    id="lawEnforcementContacted"
                    checked={formData.lawEnforcementContacted}
                    onCheckedChange={(v) =>
                      updateField("lawEnforcementContacted", v)
                    }
                  />
                </div>
                {formData.lawEnforcementContacted && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor="lawEnforcementResponse">
                      Describe law enforcement response
                    </Label>
                    <Textarea
                      id="lawEnforcementResponse"
                      value={formData.lawEnforcementResponse}
                      onChange={(e) =>
                        updateField("lawEnforcementResponse", e.target.value)
                      }
                      placeholder="What was the law enforcement response?"
                      rows={2}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionsToProtectEmployees">
                  Actions taken to protect employees
                </Label>
                <Textarea
                  id="actionsToProtectEmployees"
                  value={formData.actionsToProtectEmployees}
                  onChange={(e) =>
                    updateField("actionsToProtectEmployees", e.target.value)
                  }
                  placeholder="What steps were taken to protect employees (e.g., evacuation, lockdown, additional security)?"
                  rows={3}
                />
              </div>
            </>
          )}

          {/* Step 5: Injuries & Medical */}
          {step === 5 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="injuriesOccurred">
                      Did injuries occur?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Were any employees or others injured?
                    </p>
                  </div>
                  <Switch
                    id="injuriesOccurred"
                    checked={formData.injuriesOccurred}
                    onCheckedChange={(v) =>
                      updateField("injuriesOccurred", v)
                    }
                  />
                </div>
                {formData.injuriesOccurred && (
                  <div className="space-y-2 pl-4 border-l-2 border-muted">
                    <Label htmlFor="injuriesDescription">
                      Describe injuries (no PII)
                    </Label>
                    <Textarea
                      id="injuriesDescription"
                      value={formData.injuriesDescription}
                      onChange={(e) =>
                        updateField("injuriesDescription", e.target.value)
                      }
                      placeholder="Describe the nature and extent of injuries without identifying individuals..."
                      rows={3}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="emergencyMedicalContacted">
                      Was emergency medical contacted?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Paramedics, ambulance, or other emergency medical
                      services.
                    </p>
                  </div>
                  <Switch
                    id="emergencyMedicalContacted"
                    checked={formData.emergencyMedicalContacted}
                    onCheckedChange={(v) =>
                      updateField("emergencyMedicalContacted", v)
                    }
                  />
                </div>
                {formData.emergencyMedicalContacted && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="emergencyResponderType">
                        Responder type
                      </Label>
                      <Input
                        id="emergencyResponderType"
                        value={formData.emergencyResponderType}
                        onChange={(e) =>
                          updateField("emergencyResponderType", e.target.value)
                        }
                        placeholder="e.g., Paramedics, Fire Department"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyDescription">
                        Describe medical response
                      </Label>
                      <Textarea
                        id="emergencyDescription"
                        value={formData.emergencyDescription}
                        onChange={(e) =>
                          updateField("emergencyDescription", e.target.value)
                        }
                        placeholder="What medical assistance was provided?"
                        rows={2}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="calOshaRequired">
                      Cal/OSHA reporting required?
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Serious injuries, illness, or death must be reported to
                      Cal/OSHA.
                    </p>
                  </div>
                  <Switch
                    id="calOshaRequired"
                    checked={formData.calOshaRequired}
                    onCheckedChange={(v) =>
                      updateField("calOshaRequired", v)
                    }
                  />
                </div>
                {formData.calOshaRequired && (
                  <div className="space-y-4 pl-4 border-l-2 border-muted">
                    <div className="space-y-2">
                      <Label htmlFor="calOshaReportedAt">Date reported</Label>
                      <Input
                        id="calOshaReportedAt"
                        type="date"
                        value={formData.calOshaReportedAt}
                        onChange={(e) =>
                          updateField("calOshaReportedAt", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="calOshaRepresentativeName">
                        Cal/OSHA representative name
                      </Label>
                      <Input
                        id="calOshaRepresentativeName"
                        value={formData.calOshaRepresentativeName}
                        onChange={(e) =>
                          updateField(
                            "calOshaRepresentativeName",
                            e.target.value
                          )
                        }
                        placeholder="Name of Cal/OSHA representative contacted"
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 6: Completed By */}
          {step === 6 && (
            <>
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-600 dark:text-yellow-400" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium">PII Reminder</p>
                    <p className="mt-1">
                      Per LC 6401.9(d), the violent incident log must not
                      contain personally identifiable information. Please review
                      your entries before submitting.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="completedByName">
                  Your Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="completedByName"
                  value={formData.completedByName}
                  onChange={(e) =>
                    updateField("completedByName", e.target.value)
                  }
                  placeholder="Full name of person completing this report"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="completedByTitle">
                  Your Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="completedByTitle"
                  value={formData.completedByTitle}
                  onChange={(e) =>
                    updateField("completedByTitle", e.target.value)
                  }
                  placeholder="Job title (e.g., HR Manager, Safety Officer)"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || saving}
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Submit Incident
                </>
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
