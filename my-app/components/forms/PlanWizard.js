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
  FileSearch,
  GraduationCap,
  FolderArchive,
  CalendarClock,
  PenLine,
  ClipboardCheck,
  CheckCircle2,
  Eye,
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
import { ALERT_METHODS, VIOLENCE_TYPES, INDUSTRY_HAZARDS, TRAINING_TOPICS } from "@/constants";

const TOTAL_STEPS = 11;

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
  {
    title: "Post-Incident",
    description: "Define procedures for responding to workplace violence incidents",
    icon: FileSearch,
  },
  {
    title: "Training Program",
    description: "Describe your workplace violence prevention training program",
    icon: GraduationCap,
  },
  {
    title: "Recordkeeping",
    description: "Set retention periods and access procedures for records",
    icon: FolderArchive,
  },
  {
    title: "Review Schedule",
    description: "Set up your annual plan review schedule",
    icon: CalendarClock,
  },
  {
    title: "Authorization",
    description: "Authorize and sign your Workplace Violence Prevention Plan",
    icon: PenLine,
  },
  {
    title: "Review & Publish",
    description: "Review your complete plan and publish it",
    icon: ClipboardCheck,
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

const DEFAULT_INVESTIGATION_STEPS = [
  "Visit the scene as soon as safe and practicable",
  "Interview involved parties and witnesses",
  "Review security footage if available",
  "Determine cause and contributing factors",
  "Take corrective action",
  "Record findings in violent incident log",
];

const DEFAULT_SUPPORT_RESOURCES = [
  "Employee Assistance Program (EAP)",
  "Local crisis hotline",
  "Management support and check-ins",
];

const REVIEW_MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

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

    // Step 6: Hazard Correction Procedures
    hazardCorrectionProcedures: {
      immediateThreatProcedure: "",
      documentationProcess: "",
      engineeringControls: [""],
      workPracticeControls: [""],
      administrativeControls: [""],
      ...existingPlan?.hazardCorrectionProcedures,
    },

    // Step 6: Post-Incident Procedures
    postIncidentProcedures: {
      investigationSteps: existingPlan?.postIncidentProcedures?.investigationSteps?.length
        ? existingPlan.postIncidentProcedures.investigationSteps
        : [...DEFAULT_INVESTIGATION_STEPS],
      supportResources: existingPlan?.postIncidentProcedures?.supportResources?.length
        ? existingPlan.postIncidentProcedures.supportResources
        : [...DEFAULT_SUPPORT_RESOURCES],
      counselingAvailable: false,
      counselingProvider: "",
      ...existingPlan?.postIncidentProcedures,
    },

    // Step 7: Training Program
    trainingProgram: {
      initialTrainingDescription: "",
      annualRefresherDescription: "",
      newHazardTrainingDescription: "",
      trainingTopics: existingPlan?.trainingProgram?.trainingTopics?.length
        ? existingPlan.trainingProgram.trainingTopics
        : [...TRAINING_TOPICS],
      ...existingPlan?.trainingProgram,
    },

    // Step 8: Recordkeeping
    recordkeepingProcedures: {
      hazardRecordsRetention: 5,
      trainingRecordsRetention: 1,
      incidentLogRetention: 5,
      accessProcedure: "",
      ...existingPlan?.recordkeepingProcedures,
    },

    // Step 8: Plan Accessibility
    planAccessibility: {
      physicalLocation: "",
      electronicAccess: true,
      electronicLocation: "",
      ...existingPlan?.planAccessibility,
    },

    // Step 9: Review Schedule
    reviewSchedule: {
      annualReviewMonth: "",
      reviewProcedure: "",
      ...existingPlan?.reviewSchedule,
    },

    // Step 10: Authorization
    authorization: {
      authorizerName: "",
      authorizerTitle: "",
      authorizationStatement: "",
      agreed: false,
      ...existingPlan?.authorization,
    },
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

  // --- Hazard Correction helpers ---
  function updateHazardCorrection(field, value) {
    setFormData((prev) => ({
      ...prev,
      hazardCorrectionProcedures: { ...prev.hazardCorrectionProcedures, [field]: value },
    }));
  }

  function updateCorrectionControl(field, index, value) {
    setFormData((prev) => {
      const list = [...prev.hazardCorrectionProcedures[field]];
      list[index] = value;
      return {
        ...prev,
        hazardCorrectionProcedures: { ...prev.hazardCorrectionProcedures, [field]: list },
      };
    });
  }

  function addCorrectionControl(field) {
    setFormData((prev) => ({
      ...prev,
      hazardCorrectionProcedures: {
        ...prev.hazardCorrectionProcedures,
        [field]: [...prev.hazardCorrectionProcedures[field], ""],
      },
    }));
  }

  function removeCorrectionControl(field, index) {
    setFormData((prev) => ({
      ...prev,
      hazardCorrectionProcedures: {
        ...prev.hazardCorrectionProcedures,
        [field]: prev.hazardCorrectionProcedures[field].filter((_, i) => i !== index),
      },
    }));
  }

  // --- Post-Incident helpers ---
  function updatePostIncident(field, value) {
    setFormData((prev) => ({
      ...prev,
      postIncidentProcedures: { ...prev.postIncidentProcedures, [field]: value },
    }));
  }

  function updateInvestigationStep(index, value) {
    setFormData((prev) => {
      const steps = [...prev.postIncidentProcedures.investigationSteps];
      steps[index] = value;
      return {
        ...prev,
        postIncidentProcedures: { ...prev.postIncidentProcedures, investigationSteps: steps },
      };
    });
  }

  function addInvestigationStep() {
    setFormData((prev) => ({
      ...prev,
      postIncidentProcedures: {
        ...prev.postIncidentProcedures,
        investigationSteps: [...prev.postIncidentProcedures.investigationSteps, ""],
      },
    }));
  }

  function removeInvestigationStep(index) {
    setFormData((prev) => ({
      ...prev,
      postIncidentProcedures: {
        ...prev.postIncidentProcedures,
        investigationSteps: prev.postIncidentProcedures.investigationSteps.filter((_, i) => i !== index),
      },
    }));
  }

  function updateSupportResource(index, value) {
    setFormData((prev) => {
      const resources = [...prev.postIncidentProcedures.supportResources];
      resources[index] = value;
      return {
        ...prev,
        postIncidentProcedures: { ...prev.postIncidentProcedures, supportResources: resources },
      };
    });
  }

  function addSupportResource() {
    setFormData((prev) => ({
      ...prev,
      postIncidentProcedures: {
        ...prev.postIncidentProcedures,
        supportResources: [...prev.postIncidentProcedures.supportResources, ""],
      },
    }));
  }

  function removeSupportResource(index) {
    setFormData((prev) => ({
      ...prev,
      postIncidentProcedures: {
        ...prev.postIncidentProcedures,
        supportResources: prev.postIncidentProcedures.supportResources.filter((_, i) => i !== index),
      },
    }));
  }

  // --- Training Program helpers ---
  function updateTrainingProgram(field, value) {
    setFormData((prev) => ({
      ...prev,
      trainingProgram: { ...prev.trainingProgram, [field]: value },
    }));
  }

  function toggleTrainingTopic(topic) {
    setFormData((prev) => {
      const current = prev.trainingProgram.trainingTopics || [];
      const updated = current.includes(topic)
        ? current.filter((t) => t !== topic)
        : [...current, topic];
      return {
        ...prev,
        trainingProgram: { ...prev.trainingProgram, trainingTopics: updated },
      };
    });
  }

  // --- Recordkeeping helpers ---
  function updateRecordkeeping(field, value) {
    setFormData((prev) => ({
      ...prev,
      recordkeepingProcedures: { ...prev.recordkeepingProcedures, [field]: value },
    }));
  }

  function updatePlanAccessibility(field, value) {
    setFormData((prev) => ({
      ...prev,
      planAccessibility: { ...prev.planAccessibility, [field]: value },
    }));
  }

  // --- Review Schedule helpers ---
  function updateReviewSchedule(field, value) {
    setFormData((prev) => ({
      ...prev,
      reviewSchedule: { ...prev.reviewSchedule, [field]: value },
    }));
  }

  // --- Authorization helpers ---
  function updateAuthorization(field, value) {
    setFormData((prev) => ({
      ...prev,
      authorization: { ...prev.authorization, [field]: value },
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
      case 5: {
        if (formData.postIncidentProcedures.investigationSteps.length === 0)
          return "At least one investigation step is required.";
        return "";
      }
      case 6: {
        if (formData.trainingProgram.trainingTopics.length === 0)
          return "Select at least one training topic.";
        return "";
      }
      case 7:
        return ""; // Recordkeeping has defaults
      case 8: {
        if (!formData.reviewSchedule.annualReviewMonth)
          return "Please select an annual review month.";
        return "";
      }
      case 9: {
        if (!formData.authorization.authorizerName.trim())
          return "Authorizer name is required.";
        if (!formData.authorization.authorizerTitle.trim())
          return "Authorizer title is required.";
        if (!formData.authorization.agreed)
          return "You must agree to the authorization statement.";
        return "";
      }
      case 10:
        return ""; // Review step — no validation needed
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

  function buildPayload() {
    // Strip the UI-only `agreed` field from authorization
    const { agreed, ...authFields } = formData.authorization;
    return {
      ...formData,
      authorization: {
        ...authFields,
        signedAt: agreed ? new Date().toISOString() : undefined,
      },
    };
  }

  async function handleSaveDraft() {
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        ...buildPayload(),
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

  async function handlePublish() {
    setError("");
    setSubmitting(true);

    try {
      // First create/save the plan
      const payload = {
        ...buildPayload(),
        status: "draft",
      };

      const createRes = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!createRes.ok) {
        const body = await createRes.json();
        throw new Error(body.error || "Failed to save plan");
      }

      const plan = await createRes.json();

      // Then publish it
      const pubRes = await fetch(`/api/plans/${plan._id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!pubRes.ok) {
        const body = await pubRes.json();
        throw new Error(body.error || "Failed to publish plan");
      }

      router.push(`/plans/${plan._id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const StepIcon = STEP_META[step]?.icon ?? ClipboardCheck;

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
        <div className="flex justify-between overflow-x-auto gap-1">
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
                className={`flex flex-col items-center gap-1 text-xs transition-colors shrink-0 ${
                  i === step
                    ? "text-primary font-medium"
                    : i < step
                      ? "text-primary/60 cursor-pointer"
                      : "text-muted-foreground"
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
                    i === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : i < step
                        ? "border-primary/60 bg-primary/10 text-primary/60"
                        : "border-muted-foreground/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="hidden lg:block max-w-[72px] truncate">{s.title}</span>
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

          {/* Step 5: Post-Incident Procedures */}
          {step === 5 && (
            <div className="space-y-6">
              {/* Hazard Correction */}
              <div className="space-y-4">
                <h3 className="font-medium">Hazard Correction Procedures</h3>

                <div className="space-y-2">
                  <Label>Immediate Threat Procedure</Label>
                  <Textarea
                    placeholder="Describe the procedure when an immediate threat is identified..."
                    value={formData.hazardCorrectionProcedures.immediateThreatProcedure}
                    onChange={(e) =>
                      updateHazardCorrection("immediateThreatProcedure", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Documentation Process</Label>
                  <Textarea
                    placeholder="Describe how hazard corrections will be documented..."
                    value={formData.hazardCorrectionProcedures.documentationProcess}
                    onChange={(e) =>
                      updateHazardCorrection("documentationProcess", e.target.value)
                    }
                    rows={2}
                  />
                </div>

                {[
                  { field: "engineeringControls", label: "Engineering Controls", placeholder: "e.g., Improved lighting, security cameras, barriers" },
                  { field: "workPracticeControls", label: "Work Practice Controls", placeholder: "e.g., Buddy system, de-escalation procedures" },
                  { field: "administrativeControls", label: "Administrative Controls", placeholder: "e.g., Policies, scheduling, staffing levels" },
                ].map(({ field, label, placeholder }) => (
                  <div key={field} className="space-y-3">
                    <Label>{label}</Label>
                    {(formData.hazardCorrectionProcedures[field] || []).map((item, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input
                          placeholder={placeholder}
                          value={item}
                          onChange={(e) =>
                            updateCorrectionControl(field, idx, e.target.value)
                          }
                        />
                        {formData.hazardCorrectionProcedures[field].length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCorrectionControl(field, idx)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addCorrectionControl(field)}
                    >
                      <Plus className="h-4 w-4" />
                      Add {label.replace("Controls", "Control")}
                    </Button>
                  </div>
                ))}
              </div>

              {/* Post-Incident Investigation */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Post-Incident Investigation</h3>
                <p className="text-xs text-muted-foreground">
                  Default steps are provided. Edit, reorder, or add your own.
                </p>

                <div className="space-y-3">
                  <Label>
                    Investigation Steps{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  {formData.postIncidentProcedures.investigationSteps.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs text-muted-foreground">
                        {idx + 1}.
                      </span>
                      <Input
                        value={s}
                        onChange={(e) =>
                          updateInvestigationStep(idx, e.target.value)
                        }
                      />
                      {formData.postIncidentProcedures.investigationSteps.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeInvestigationStep(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addInvestigationStep}
                  >
                    <Plus className="h-4 w-4" />
                    Add Step
                  </Button>
                </div>
              </div>

              {/* Support Resources */}
              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Support Resources</h3>

                <div className="space-y-3">
                  <Label>Available Resources</Label>
                  {formData.postIncidentProcedures.supportResources.map((r, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input
                        placeholder="Support resource"
                        value={r}
                        onChange={(e) =>
                          updateSupportResource(idx, e.target.value)
                        }
                      />
                      {formData.postIncidentProcedures.supportResources.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSupportResource(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addSupportResource}
                  >
                    <Plus className="h-4 w-4" />
                    Add Resource
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Counseling Available
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Offer professional counseling after incidents
                    </p>
                  </div>
                  <Switch
                    checked={formData.postIncidentProcedures.counselingAvailable}
                    onCheckedChange={(v) =>
                      updatePostIncident("counselingAvailable", v)
                    }
                  />
                </div>

                {formData.postIncidentProcedures.counselingAvailable && (
                  <div className="space-y-2 pl-4">
                    <Label>Counseling Provider</Label>
                    <Input
                      placeholder="e.g., Employee Assistance Program, local counseling service"
                      value={formData.postIncidentProcedures.counselingProvider}
                      onChange={(e) =>
                        updatePostIncident("counselingProvider", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 6: Training Program */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Initial Training Description</Label>
                <Textarea
                  placeholder="Describe the initial training program for new employees..."
                  value={formData.trainingProgram.initialTrainingDescription}
                  onChange={(e) =>
                    updateTrainingProgram("initialTrainingDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Annual Refresher Description</Label>
                <Textarea
                  placeholder="Describe the annual refresher training program..."
                  value={formData.trainingProgram.annualRefresherDescription}
                  onChange={(e) =>
                    updateTrainingProgram("annualRefresherDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>New Hazard Training Description</Label>
                <Textarea
                  placeholder="Describe how training will be provided when new hazards are identified..."
                  value={formData.trainingProgram.newHazardTrainingDescription}
                  onChange={(e) =>
                    updateTrainingProgram("newHazardTrainingDescription", e.target.value)
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>
                  Training Topics{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Required topics per California Labor Code Section 6401.9 are
                  pre-selected. Add or remove topics as needed.
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {TRAINING_TOPICS.map((topic) => (
                    <label
                      key={topic}
                      className="flex cursor-pointer items-start gap-2 rounded-md border p-3 text-sm transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={(formData.trainingProgram.trainingTopics || []).includes(topic)}
                        onCheckedChange={() => toggleTrainingTopic(topic)}
                      />
                      {topic}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 7: Recordkeeping & Access */}
          {step === 7 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Retention Periods</h3>
                <p className="text-xs text-muted-foreground">
                  California law sets minimum retention periods. You may set
                  longer periods but not shorter.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Hazard Records (years)</Label>
                    <Select
                      value={String(formData.recordkeepingProcedures.hazardRecordsRetention)}
                      onValueChange={(v) =>
                        updateRecordkeeping("hazardRecordsRetention", Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} years {n === 5 ? "(minimum)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Training Records (years)</Label>
                    <Select
                      value={String(formData.recordkeepingProcedures.trainingRecordsRetention)}
                      onValueChange={(v) =>
                        updateRecordkeeping("trainingRecordsRetention", Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} year{n > 1 ? "s" : ""} {n === 1 ? "(minimum)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Incident Log (years)</Label>
                    <Select
                      value={String(formData.recordkeepingProcedures.incidentLogRetention)}
                      onValueChange={(v) =>
                        updateRecordkeeping("incidentLogRetention", Number(v))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 6, 7, 8, 9, 10].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} years {n === 5 ? "(minimum)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Records Access Procedure</Label>
                  <Textarea
                    placeholder="Describe how employees can request access to records (must be within 15 calendar days)..."
                    value={formData.recordkeepingProcedures.accessProcedure}
                    onChange={(e) =>
                      updateRecordkeeping("accessProcedure", e.target.value)
                    }
                    rows={3}
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-medium">Plan Accessibility</h3>

                <div className="space-y-2">
                  <Label>Physical Location</Label>
                  <Input
                    placeholder="e.g., Company office, break room bulletin board"
                    value={formData.planAccessibility.physicalLocation}
                    onChange={(e) =>
                      updatePlanAccessibility("physicalLocation", e.target.value)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">
                      Electronic Access
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Make the plan available electronically
                    </p>
                  </div>
                  <Switch
                    checked={formData.planAccessibility.electronicAccess}
                    onCheckedChange={(v) =>
                      updatePlanAccessibility("electronicAccess", v)
                    }
                  />
                </div>

                {formData.planAccessibility.electronicAccess && (
                  <div className="space-y-2 pl-4">
                    <Label>Electronic Location</Label>
                    <Input
                      placeholder="e.g., Company intranet, shared drive, SafeWorkCA portal"
                      value={formData.planAccessibility.electronicLocation}
                      onChange={(e) =>
                        updatePlanAccessibility("electronicLocation", e.target.value)
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 8: Review Schedule */}
          {step === 8 && (
            <div className="space-y-6">
              <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  California Labor Code Section 6401.9 requires employers to review
                  and revise their WVPP at least annually, when deficiencies are
                  observed, and after any workplace violence incident.
                </span>
              </div>

              <div className="space-y-2">
                <Label>
                  Annual Review Month{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.reviewSchedule.annualReviewMonth ? String(formData.reviewSchedule.annualReviewMonth) : ""}
                  onValueChange={(v) =>
                    updateReviewSchedule("annualReviewMonth", Number(v))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a month for annual review" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Review Procedure</Label>
                <Textarea
                  placeholder="Describe the procedure for reviewing and updating the WVPP..."
                  value={formData.reviewSchedule.reviewProcedure}
                  onChange={(e) =>
                    updateReviewSchedule("reviewProcedure", e.target.value)
                  }
                  rows={4}
                />
              </div>

              <div className="rounded-lg border p-4 space-y-2">
                <h4 className="text-sm font-medium">Plan will also be reviewed when:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                  <li>Deficiencies are observed in the plan</li>
                  <li>A workplace violence incident occurs</li>
                  <li>New hazards are identified</li>
                  <li>Changes in workplace conditions or operations</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 9: Authorization */}
          {step === 9 && (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Authorizer Name{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="Full name of authorizing person"
                    value={formData.authorization.authorizerName}
                    onChange={(e) =>
                      updateAuthorization("authorizerName", e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Authorizer Title{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="e.g., Owner, CEO, General Manager"
                    value={formData.authorization.authorizerTitle}
                    onChange={(e) =>
                      updateAuthorization("authorizerTitle", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Authorization Statement</Label>
                <Textarea
                  placeholder="Optional: customize the authorization statement. A default will be used if left blank."
                  value={formData.authorization.authorizationStatement}
                  onChange={(e) =>
                    updateAuthorization("authorizationStatement", e.target.value)
                  }
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  If left blank, a standard authorization statement will be included
                  in the plan document.
                </p>
              </div>

              <div className="rounded-lg border p-4 bg-muted/50 space-y-3">
                <h4 className="text-sm font-medium">E-Signature</h4>
                <p className="text-sm text-muted-foreground">
                  By checking the box below, you acknowledge that you are
                  electronically signing this Workplace Violence Prevention Plan
                  and are committing to its implementation.
                </p>
                <label className="flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors hover:bg-accent has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                  <Checkbox
                    className="mt-0.5"
                    checked={formData.authorization.agreed}
                    onCheckedChange={(v) => updateAuthorization("agreed", v)}
                  />
                  <span className="text-sm">
                    I, <strong>{formData.authorization.authorizerName || "[Name]"}</strong>,{" "}
                    <strong>{formData.authorization.authorizerTitle || "[Title]"}</strong>,
                    hereby authorize and ensure the establishment, implementation,
                    and maintenance of this written workplace violence prevention
                    plan. <span className="text-destructive">*</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 10: Review & Publish */}
          {step === 10 && (
            <div className="space-y-6">
              <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Review your plan details below. You can go back to any step to make changes.
                  When ready, save as a draft or publish your plan.
                </span>
              </div>

              {/* Summary sections */}
              <div className="space-y-4">
                {/* Responsible Persons */}
                <SummarySection
                  title="Responsible Persons"
                  stepIndex={0}
                  onEdit={() => { setError(""); setStep(0); }}
                >
                  {formData.responsiblePersons.map((p, i) => (
                    <p key={i} className="text-sm">
                      <strong>{p.name}</strong> — {p.title}
                      {p.email && ` (${p.email})`}
                    </p>
                  ))}
                </SummarySection>

                {/* Employee Involvement */}
                <SummarySection
                  title="Employee Involvement"
                  stepIndex={1}
                  onEdit={() => { setError(""); setStep(1); }}
                >
                  <p className="text-sm">
                    Meeting frequency: {formData.employeeInvolvement.meetingFrequency || "—"}
                  </p>
                </SummarySection>

                {/* Communication */}
                <SummarySection
                  title="Communication System"
                  stepIndex={2}
                  onEdit={() => { setError(""); setStep(2); }}
                >
                  <div className="flex flex-wrap gap-2 text-xs">
                    {formData.communicationSystem.newEmployeeOrientation && (
                      <span className="rounded bg-primary/10 px-2 py-0.5">Orientation</span>
                    )}
                    {formData.communicationSystem.regularMeetings && (
                      <span className="rounded bg-primary/10 px-2 py-0.5">Regular Meetings</span>
                    )}
                    {formData.communicationSystem.postedInformation && (
                      <span className="rounded bg-primary/10 px-2 py-0.5">Posted Info</span>
                    )}
                    {formData.communicationSystem.anonymousReporting && (
                      <span className="rounded bg-primary/10 px-2 py-0.5">Anonymous Reporting</span>
                    )}
                  </div>
                </SummarySection>

                {/* Emergency Response */}
                <SummarySection
                  title="Emergency Response"
                  stepIndex={3}
                  onEdit={() => { setError(""); setStep(3); }}
                >
                  <p className="text-sm">
                    Alert methods: {formData.emergencyResponse.alertMethods.length} configured
                  </p>
                  <p className="text-sm">
                    Emergency contacts: {formData.emergencyResponse.emergencyContacts.filter((c) => c.name).length}
                  </p>
                </SummarySection>

                {/* Hazard Assessment */}
                <SummarySection
                  title="Hazard Assessment"
                  stepIndex={4}
                  onEdit={() => { setError(""); setStep(4); }}
                >
                  <p className="text-sm">
                    {formData.hazardAssessments.length} hazard{formData.hazardAssessments.length !== 1 ? "s" : ""} identified
                  </p>
                </SummarySection>

                {/* Post-Incident */}
                <SummarySection
                  title="Post-Incident Procedures"
                  stepIndex={5}
                  onEdit={() => { setError(""); setStep(5); }}
                >
                  <p className="text-sm">
                    {formData.postIncidentProcedures.investigationSteps.length} investigation steps
                  </p>
                  <p className="text-sm">
                    Counseling: {formData.postIncidentProcedures.counselingAvailable ? "Yes" : "No"}
                  </p>
                </SummarySection>

                {/* Training */}
                <SummarySection
                  title="Training Program"
                  stepIndex={6}
                  onEdit={() => { setError(""); setStep(6); }}
                >
                  <p className="text-sm">
                    {formData.trainingProgram.trainingTopics.length} training topics selected
                  </p>
                </SummarySection>

                {/* Recordkeeping */}
                <SummarySection
                  title="Recordkeeping & Access"
                  stepIndex={7}
                  onEdit={() => { setError(""); setStep(7); }}
                >
                  <p className="text-sm">
                    Hazard records: {formData.recordkeepingProcedures.hazardRecordsRetention} yrs |
                    Training: {formData.recordkeepingProcedures.trainingRecordsRetention} yr |
                    Incidents: {formData.recordkeepingProcedures.incidentLogRetention} yrs
                  </p>
                </SummarySection>

                {/* Review Schedule */}
                <SummarySection
                  title="Review Schedule"
                  stepIndex={8}
                  onEdit={() => { setError(""); setStep(8); }}
                >
                  <p className="text-sm">
                    Annual review: {
                      formData.reviewSchedule.annualReviewMonth
                        ? REVIEW_MONTHS.find((m) => m.value === String(formData.reviewSchedule.annualReviewMonth))?.label
                        : "—"
                    }
                  </p>
                </SummarySection>

                {/* Authorization */}
                <SummarySection
                  title="Authorization"
                  stepIndex={9}
                  onEdit={() => { setError(""); setStep(9); }}
                >
                  <p className="text-sm">
                    Authorized by: {formData.authorization.authorizerName || "—"},{" "}
                    {formData.authorization.authorizerTitle || "—"}
                  </p>
                  <p className="text-sm">
                    Signed: {formData.authorization.agreed ? "Yes" : "No"}
                  </p>
                </SummarySection>
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
              <Button onClick={handlePublish} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Publishing..." : "Publish Plan"}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function SummarySection({ title, onEdit, children }) {
  return (
    <div className="flex items-start justify-between rounded-lg border p-4">
      <div className="space-y-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <div className="text-muted-foreground">{children}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Eye className="h-4 w-4" />
        Edit
      </Button>
    </div>
  );
}
