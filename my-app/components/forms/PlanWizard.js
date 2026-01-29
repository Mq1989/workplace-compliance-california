"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  UserCheck,
  Users,
  MessageSquare,
  ShieldAlert,
  Search,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
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
import { ALERT_METHODS, VIOLENCE_TYPES, INDUSTRY_HAZARDS } from "@/constants";

const TOTAL_STEPS = 5;

const STEP_META = [
  {
    title: "Responsible Persons",
    description: "Who is responsible for implementing and maintaining your WVPP?",
    icon: UserCheck,
  },
  {
    title: "Employee Involvement",
    description: "How will employees participate in your WVPP?",
    icon: Users,
  },
  {
    title: "Communication System",
    description: "How will you communicate WVPP information to employees?",
    icon: MessageSquare,
  },
  {
    title: "Emergency Response",
    description: "What are your emergency response procedures?",
    icon: ShieldAlert,
  },
  {
    title: "Hazard Assessment",
    description: "Identify and evaluate workplace violence hazards",
    icon: Search,
  },
];

const RESPONSIBILITY_OPTIONS = [
  "Overall WVPP implementation",
  "Employee training coordination",
  "Incident investigation",
  "Hazard assessment",
  "Emergency response coordination",
  "Record keeping and documentation",
  "Employee communication",
  "Plan review and updates",
];

const MEETING_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every Two Weeks" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

const EMPTY_PERSON = {
  name: "",
  title: "",
  phone: "",
  email: "",
  responsibilities: [],
};

const EMPTY_EMERGENCY_CONTACT = {
  name: "",
  title: "",
  phone: "",
  email: "",
  responsibilities: [],
};

export default function PlanWizard({ existingPlan, industry }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    // Step 1: Responsible Persons
    responsiblePersons: existingPlan?.responsiblePersons?.length
      ? existingPlan.responsiblePersons
      : [{ ...EMPTY_PERSON }],

    // Step 2: Employee Involvement
    employeeInvolvement: {
      meetingFrequency: "",
      meetingDescription: "",
      trainingInvolvementDescription: "",
      reportingProceduresDescription: "",
      ...existingPlan?.employeeInvolvement,
    },

    // Step 2 also: Compliance Procedures
    complianceProcedures: {
      trainingDescription: "",
      supervisionDescription: "",
      recognitionProgram: "",
      disciplinaryProcess: "",
      ...existingPlan?.complianceProcedures,
    },

    // Step 3: Communication System
    communicationSystem: {
      newEmployeeOrientation: true,
      regularMeetings: true,
      meetingFrequency: "",
      postedInformation: true,
      postingLocations: "",
      reportingHotline: "",
      reportingForm: "",
      anonymousReporting: false,
      ...existingPlan?.communicationSystem,
    },

    // Step 4: Emergency Response
    emergencyResponse: {
      alertMethods: [],
      evacuationPlanDescription: "",
      shelterLocations: [""],
      emergencyContacts: [{ ...EMPTY_EMERGENCY_CONTACT }],
      lawEnforcementContact: "",
      ...existingPlan?.emergencyResponse,
    },

    // Step 5: Hazard Assessment
    hazardAssessments: existingPlan?.hazardAssessments?.length
      ? existingPlan.hazardAssessments
      : [],
  });

  // Pre-populate industry hazards if no existing assessments
  useEffect(() => {
    if (
      industry &&
      INDUSTRY_HAZARDS[industry] &&
      formData.hazardAssessments.length === 0
    ) {
      const prePopulated = INDUSTRY_HAZARDS[industry].map((h) => ({
        hazardType: h.type,
        description: h.description,
        riskLevel: h.riskLevel,
        controlMeasures: [...h.controls],
      }));
      setFormData((prev) => ({ ...prev, hazardAssessments: prePopulated }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  // --- Update helpers ---
  function updateResponsiblePerson(index, field, value) {
    setFormData((prev) => {
      const persons = [...prev.responsiblePersons];
      persons[index] = { ...persons[index], [field]: value };
      return { ...prev, responsiblePersons: persons };
    });
  }

  function toggleResponsibility(personIndex, responsibility) {
    setFormData((prev) => {
      const persons = [...prev.responsiblePersons];
      const current = persons[personIndex].responsibilities || [];
      persons[personIndex] = {
        ...persons[personIndex],
        responsibilities: current.includes(responsibility)
          ? current.filter((r) => r !== responsibility)
          : [...current, responsibility],
      };
      return { ...prev, responsiblePersons: persons };
    });
  }

  function addResponsiblePerson() {
    setFormData((prev) => ({
      ...prev,
      responsiblePersons: [...prev.responsiblePersons, { ...EMPTY_PERSON }],
    }));
  }

  function removeResponsiblePerson(index) {
    setFormData((prev) => ({
      ...prev,
      responsiblePersons: prev.responsiblePersons.filter((_, i) => i !== index),
    }));
  }

  function updateInvolvement(field, value) {
    setFormData((prev) => ({
      ...prev,
      employeeInvolvement: { ...prev.employeeInvolvement, [field]: value },
    }));
  }

  function updateCompliance(field, value) {
    setFormData((prev) => ({
      ...prev,
      complianceProcedures: { ...prev.complianceProcedures, [field]: value },
    }));
  }

  function updateCommunication(field, value) {
    setFormData((prev) => ({
      ...prev,
      communicationSystem: { ...prev.communicationSystem, [field]: value },
    }));
  }

  function updateEmergency(field, value) {
    setFormData((prev) => ({
      ...prev,
      emergencyResponse: { ...prev.emergencyResponse, [field]: value },
    }));
  }

  function toggleAlertMethod(method) {
    setFormData((prev) => {
      const current = prev.emergencyResponse.alertMethods || [];
      const updated = current.includes(method)
        ? current.filter((m) => m !== method)
        : [...current, method];
      return {
        ...prev,
        emergencyResponse: { ...prev.emergencyResponse, alertMethods: updated },
      };
    });
  }

  function updateShelterLocation(index, value) {
    setFormData((prev) => {
      const locations = [...prev.emergencyResponse.shelterLocations];
      locations[index] = value;
      return {
        ...prev,
        emergencyResponse: {
          ...prev.emergencyResponse,
          shelterLocations: locations,
        },
      };
    });
  }

  function addShelterLocation() {
    setFormData((prev) => ({
      ...prev,
      emergencyResponse: {
        ...prev.emergencyResponse,
        shelterLocations: [...prev.emergencyResponse.shelterLocations, ""],
      },
    }));
  }

  function removeShelterLocation(index) {
    setFormData((prev) => ({
      ...prev,
      emergencyResponse: {
        ...prev.emergencyResponse,
        shelterLocations: prev.emergencyResponse.shelterLocations.filter(
          (_, i) => i !== index
        ),
      },
    }));
  }

  function updateEmergencyContact(index, field, value) {
    setFormData((prev) => {
      const contacts = [...prev.emergencyResponse.emergencyContacts];
      contacts[index] = { ...contacts[index], [field]: value };
      return {
        ...prev,
        emergencyResponse: {
          ...prev.emergencyResponse,
          emergencyContacts: contacts,
        },
      };
    });
  }

  function addEmergencyContact() {
    setFormData((prev) => ({
      ...prev,
      emergencyResponse: {
        ...prev.emergencyResponse,
        emergencyContacts: [
          ...prev.emergencyResponse.emergencyContacts,
          { ...EMPTY_EMERGENCY_CONTACT },
        ],
      },
    }));
  }

  function removeEmergencyContact(index) {
    setFormData((prev) => ({
      ...prev,
      emergencyResponse: {
        ...prev.emergencyResponse,
        emergencyContacts: prev.emergencyResponse.emergencyContacts.filter(
          (_, i) => i !== index
        ),
      },
    }));
  }

  // --- Hazard helpers ---
  function updateHazard(index, field, value) {
    setFormData((prev) => {
      const hazards = [...prev.hazardAssessments];
      hazards[index] = { ...hazards[index], [field]: value };
      return { ...prev, hazardAssessments: hazards };
    });
  }

  function updateControlMeasure(hazardIndex, controlIndex, value) {
    setFormData((prev) => {
      const hazards = [...prev.hazardAssessments];
      const controls = [...hazards[hazardIndex].controlMeasures];
      controls[controlIndex] = value;
      hazards[hazardIndex] = { ...hazards[hazardIndex], controlMeasures: controls };
      return { ...prev, hazardAssessments: hazards };
    });
  }

  function addControlMeasure(hazardIndex) {
    setFormData((prev) => {
      const hazards = [...prev.hazardAssessments];
      hazards[hazardIndex] = {
        ...hazards[hazardIndex],
        controlMeasures: [...hazards[hazardIndex].controlMeasures, ""],
      };
      return { ...prev, hazardAssessments: hazards };
    });
  }

  function removeControlMeasure(hazardIndex, controlIndex) {
    setFormData((prev) => {
      const hazards = [...prev.hazardAssessments];
      hazards[hazardIndex] = {
        ...hazards[hazardIndex],
        controlMeasures: hazards[hazardIndex].controlMeasures.filter(
          (_, i) => i !== controlIndex
        ),
      };
      return { ...prev, hazardAssessments: hazards };
    });
  }

  function addHazard() {
    setFormData((prev) => ({
      ...prev,
      hazardAssessments: [
        ...prev.hazardAssessments,
        { hazardType: "", description: "", riskLevel: "", controlMeasures: [""] },
      ],
    }));
  }

  function removeHazard(index) {
    setFormData((prev) => ({
      ...prev,
      hazardAssessments: prev.hazardAssessments.filter((_, i) => i !== index),
    }));
  }

  // --- Validation ---
  function validateStep() {
    switch (step) {
      case 0: {
        const first = formData.responsiblePersons[0];
        if (!first) return "At least one responsible person is required.";
        if (!first.name.trim()) return "WVPP administrator name is required.";
        if (!first.title.trim()) return "WVPP administrator title is required.";
        if (!first.phone.trim()) return "WVPP administrator phone is required.";
        if (!first.email.trim()) return "WVPP administrator email is required.";
        if (!first.responsibilities || first.responsibilities.length === 0)
          return "Select at least one responsibility for the WVPP administrator.";
        return "";
      }
      case 1: {
        if (!formData.employeeInvolvement.meetingFrequency)
          return "Please select a meeting frequency.";
        return "";
      }
      case 2:
        return "";
      case 3: {
        if (formData.emergencyResponse.alertMethods.length === 0)
          return "Select at least one alert method.";
        const firstContact = formData.emergencyResponse.emergencyContacts[0];
        if (!firstContact || !firstContact.name.trim())
          return "At least one emergency contact is required.";
        if (!firstContact.phone.trim())
          return "Emergency contact phone is required.";
        return "";
      }
      case 4: {
        if (formData.hazardAssessments.length === 0)
          return "At least one hazard assessment is required.";
        for (let i = 0; i < formData.hazardAssessments.length; i++) {
          const h = formData.hazardAssessments[i];
          if (!h.hazardType) return `Hazard ${i + 1}: type is required.`;
          if (!h.description.trim())
            return `Hazard ${i + 1}: description is required.`;
          if (!h.riskLevel) return `Hazard ${i + 1}: risk level is required.`;
        }
        return "";
      }
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

  async function handleSaveDraft() {
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        status: "draft",
      };

      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save plan");
      }

      const plan = await res.json();
      router.push(`/plans/${plan._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const StepIcon = STEP_META[step].icon;

  return (
    <div className="mx-auto max-w-3xl py-8">
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
          {/* Step 0: Responsible Persons */}
          {step === 0 && (
            <div className="space-y-6">
              {formData.responsiblePersons.map((person, personIdx) => (
                <div
                  key={personIdx}
                  className="space-y-4 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {personIdx === 0
                        ? "WVPP Administrator (Primary)"
                        : `Additional Responsible Person ${personIdx}`}
                    </h3>
                    {personIdx > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResponsiblePerson(personIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Jane Smith"
                        value={person.name}
                        onChange={(e) =>
                          updateResponsiblePerson(personIdx, "name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        placeholder="Safety Manager"
                        value={person.title}
                        onChange={(e) =>
                          updateResponsiblePerson(personIdx, "title", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={person.phone}
                        onChange={(e) =>
                          updateResponsiblePerson(personIdx, "phone", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        Email <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="jane@company.com"
                        value={person.email}
                        onChange={(e) =>
                          updateResponsiblePerson(personIdx, "email", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>
                      Responsibilities{" "}
                      {personIdx === 0 && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {RESPONSIBILITY_OPTIONS.map((resp) => (
                        <label
                          key={resp}
                          className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                        >
                          <Checkbox
                            checked={(person.responsibilities || []).includes(resp)}
                            onCheckedChange={() =>
                              toggleResponsibility(personIdx, resp)
                            }
                          />
                          {resp}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addResponsiblePerson}>
                <Plus className="h-4 w-4" />
                Add Another Person
              </Button>
            </div>
          )}

          {/* Step 1: Employee Involvement */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Employee Involvement</h3>

                <div className="space-y-2">
                  <Label>
                    Safety Meeting Frequency{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.employeeInvolvement.meetingFrequency}
                    onValueChange={(v) => updateInvolvement("meetingFrequency", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How often will safety meetings occur?" />
                    </SelectTrigger>
                    <SelectContent>
                      {MEETING_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Meeting Description</Label>
                  <Textarea
                    placeholder="Describe how safety meetings will be conducted and what topics will be covered..."
                    value={formData.employeeInvolvement.meetingDescription}
                    onChange={(e) =>
                      updateInvolvement("meetingDescription", e.target.value)
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Training Involvement</Label>
                  <Textarea
                    placeholder="Describe how employees will be involved in developing and implementing the training program..."
                    value={
                      formData.employeeInvolvement.trainingInvolvementDescription
                    }
                    onChange={(e) =>
                      updateInvolvement(
                        "trainingInvolvementDescription",
                        e.target.value
                      )
                    }
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reporting Procedures</Label>
                  <Textarea
                    placeholder="Describe how employees can report workplace violence concerns without fear of retaliation..."
                    value={
                      formData.employeeInvolvement.reportingProceduresDescription
                    }
                    onChange={(e) =>
                      updateInvolvement(
                        "reportingProceduresDescription",
                        e.target.value
                      )
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Compliance Procedures</h3>

                <div className="space-y-2">
                  <Label>Training Description</Label>
                  <Textarea
                    placeholder="Describe how employees will be trained on the WVPP..."
                    value={formData.complianceProcedures.trainingDescription}
                    onChange={(e) =>
                      updateCompliance("trainingDescription", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Supervision Description</Label>
                  <Textarea
                    placeholder="Describe how supervisors will monitor compliance with WVPP procedures..."
                    value={formData.complianceProcedures.supervisionDescription}
                    onChange={(e) =>
                      updateCompliance("supervisionDescription", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Recognition Program</Label>
                  <Textarea
                    placeholder="Describe how employees demonstrating safe practices will be recognized..."
                    value={formData.complianceProcedures.recognitionProgram}
                    onChange={(e) =>
                      updateCompliance("recognitionProgram", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Disciplinary Process</Label>
                  <Textarea
                    placeholder="Describe the disciplinary process for non-compliance with WVPP procedures..."
                    value={formData.complianceProcedures.disciplinaryProcess}
                    onChange={(e) =>
                      updateCompliance("disciplinaryProcess", e.target.value)
                    }
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Communication System */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-sm font-medium">
                      New Employee Orientation
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Include WVPP training in new employee orientation
                    </p>
                  </div>
                  <Switch
                    checked={formData.communicationSystem.newEmployeeOrientation}
                    onCheckedChange={(v) =>
                      updateCommunication("newEmployeeOrientation", v)
                    }
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-sm font-medium">Regular Safety Meetings</Label>
                    <p className="text-xs text-muted-foreground">
                      Hold regular meetings to discuss workplace violence concerns
                    </p>
                  </div>
                  <Switch
                    checked={formData.communicationSystem.regularMeetings}
                    onCheckedChange={(v) =>
                      updateCommunication("regularMeetings", v)
                    }
                  />
                </div>

                {formData.communicationSystem.regularMeetings && (
                  <div className="space-y-2 pl-4">
                    <Label>Meeting Frequency</Label>
                    <Select
                      value={formData.communicationSystem.meetingFrequency}
                      onValueChange={(v) =>
                        updateCommunication("meetingFrequency", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEETING_FREQUENCIES.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Posted Information
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Post WVPP information in common areas
                    </p>
                  </div>
                  <Switch
                    checked={formData.communicationSystem.postedInformation}
                    onCheckedChange={(v) =>
                      updateCommunication("postedInformation", v)
                    }
                  />
                </div>

                {formData.communicationSystem.postedInformation && (
                  <div className="space-y-2 pl-4">
                    <Label>Posting Locations</Label>
                    <Input
                      placeholder="e.g., Break room, lobby, hallways"
                      value={formData.communicationSystem.postingLocations}
                      onChange={(e) =>
                        updateCommunication("postingLocations", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Reporting Methods</h3>

                <div className="space-y-2">
                  <Label>Reporting Hotline</Label>
                  <Input
                    placeholder="e.g., (555) 999-0000"
                    value={formData.communicationSystem.reportingHotline}
                    onChange={(e) =>
                      updateCommunication("reportingHotline", e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reporting Form / URL</Label>
                  <Input
                    placeholder="e.g., https://company.com/report or describe physical form location"
                    value={formData.communicationSystem.reportingForm}
                    onChange={(e) =>
                      updateCommunication("reportingForm", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Anonymous Reporting
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow employees to report concerns anonymously
                    </p>
                  </div>
                  <Switch
                    checked={formData.communicationSystem.anonymousReporting}
                    onCheckedChange={(v) =>
                      updateCommunication("anonymousReporting", v)
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Response */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>
                  Alert Methods <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Select all methods used to alert employees during an emergency.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {ALERT_METHODS.map((method) => (
                    <label
                      key={method.value}
                      className="flex cursor-pointer items-center gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <Checkbox
                        checked={formData.emergencyResponse.alertMethods.includes(
                          method.value
                        )}
                        onCheckedChange={() => toggleAlertMethod(method.value)}
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Evacuation Plan</Label>
                <Textarea
                  placeholder="Describe your evacuation procedures, including routes and assembly points..."
                  value={formData.emergencyResponse.evacuationPlanDescription}
                  onChange={(e) =>
                    updateEmergency("evacuationPlanDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Shelter / Safe Room Locations</Label>
                {formData.emergencyResponse.shelterLocations.map((loc, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      placeholder={`Shelter location ${i + 1}`}
                      value={loc}
                      onChange={(e) => updateShelterLocation(i, e.target.value)}
                    />
                    {formData.emergencyResponse.shelterLocations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeShelterLocation(i)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addShelterLocation}>
                  <Plus className="h-4 w-4" />
                  Add Location
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Local Law Enforcement Contact</Label>
                <Input
                  placeholder="e.g., 911 or local police non-emergency line"
                  value={formData.emergencyResponse.lawEnforcementContact}
                  onChange={(e) =>
                    updateEmergency("lawEnforcementContact", e.target.value)
                  }
                />
              </div>

              <div className="space-y-4">
                <Label>
                  Emergency Contacts{" "}
                  <span className="text-destructive">*</span>
                </Label>
                {formData.emergencyResponse.emergencyContacts.map(
                  (contact, idx) => (
                    <div key={idx} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Contact {idx + 1}
                        </span>
                        {idx > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmergencyContact(idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            placeholder="Contact name"
                            value={contact.name}
                            onChange={(e) =>
                              updateEmergencyContact(idx, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Title</Label>
                          <Input
                            placeholder="Title / Role"
                            value={contact.title}
                            onChange={(e) =>
                              updateEmergencyContact(idx, "title", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">
                            Phone <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="tel"
                            placeholder="(555) 123-4567"
                            value={contact.phone}
                            onChange={(e) =>
                              updateEmergencyContact(idx, "phone", e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Email</Label>
                          <Input
                            type="email"
                            placeholder="contact@company.com"
                            value={contact.email}
                            onChange={(e) =>
                              updateEmergencyContact(idx, "email", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )
                )}
                <Button variant="outline" size="sm" onClick={addEmergencyContact}>
                  <Plus className="h-4 w-4" />
                  Add Emergency Contact
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Hazard Assessment */}
          {step === 4 && (
            <div className="space-y-6">
              {industry && INDUSTRY_HAZARDS[industry] && (
                <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Hazards have been pre-populated based on your industry. Review
                    and customize them for your specific workplace.
                  </span>
                </div>
              )}

              {formData.hazardAssessments.map((hazard, hIdx) => (
                <div key={hIdx} className="space-y-4 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Hazard {hIdx + 1}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeHazard(hIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>
                        Violence Type{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={hazard.hazardType}
                        onValueChange={(v) =>
                          updateHazard(hIdx, "hazardType", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {VIOLENCE_TYPES.map((vt) => (
                            <SelectItem key={vt.value} value={vt.value}>
                              {vt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>
                        Risk Level{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={hazard.riskLevel}
                        onValueChange={(v) =>
                          updateHazard(hIdx, "riskLevel", v)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select risk level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>
                      Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      placeholder="Describe this workplace violence hazard..."
                      value={hazard.description}
                      onChange={(e) =>
                        updateHazard(hIdx, "description", e.target.value)
                      }
                      rows={2}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Control Measures</Label>
                    {(hazard.controlMeasures || []).map((measure, cIdx) => (
                      <div key={cIdx} className="flex gap-2">
                        <Input
                          placeholder={`Control measure ${cIdx + 1}`}
                          value={measure}
                          onChange={(e) =>
                            updateControlMeasure(hIdx, cIdx, e.target.value)
                          }
                        />
                        {hazard.controlMeasures.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeControlMeasure(hIdx, cIdx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addControlMeasure(hIdx)}
                    >
                      <Plus className="h-4 w-4" />
                      Add Control Measure
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" onClick={addHazard}>
                <Plus className="h-4 w-4" />
                Add Custom Hazard
              </Button>
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

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={submitting}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Draft
            </Button>

            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSaveDraft} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Saving..." : "Save & Continue"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
