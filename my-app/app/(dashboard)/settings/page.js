"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Settings,
  Building2,
  MapPin,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { INDUSTRIES, WORKPLACE_TYPES, SUBSCRIPTION_PLANS } from "@/constants";

const TABS = [
  { key: "organization", label: "Organization", icon: Building2 },
  { key: "compliance", label: "Compliance", icon: Shield },
];

function formatDate(dateStr) {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("organization");

  // Form state
  const [form, setForm] = useState({
    name: "",
    dba: "",
    phone: "",
    email: "",
    industry: "",
    employeeCount: "",
    workplaceType: [],
    address: {
      street: "",
      city: "",
      state: "CA",
      zip: "",
    },
  });

  const fetchOrg = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) {
        if (res.status === 404) {
          setOrg(null);
          setLoading(false);
          return;
        }
        throw new Error("Failed to load settings");
      }
      const data = await res.json();
      setOrg(data);
      setForm({
        name: data.name || "",
        dba: data.dba || "",
        phone: data.phone || "",
        email: data.email || "",
        industry: data.industry || "",
        employeeCount: data.employeeCount?.toString() || "",
        workplaceType: data.workplaceType || [],
        address: {
          street: data.address?.street || "",
          city: data.address?.city || "",
          state: data.address?.state || "CA",
          zip: data.address?.zip || "",
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrg();
  }, [fetchOrg]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddress(field, value) {
    setForm((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }

  function toggleWorkplaceType(type) {
    setForm((prev) => {
      const types = prev.workplaceType.includes(type)
        ? prev.workplaceType.filter((t) => t !== type)
        : [...prev.workplaceType, type];
      return { ...prev, workplaceType: types };
    });
  }

  async function handleSave() {
    setError(null);
    setSuccess(null);

    // Validation
    if (!form.name.trim()) {
      setError("Company name is required.");
      return;
    }
    if (!form.email.trim()) {
      setError("Contact email is required.");
      return;
    }
    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }
    if (!form.address.street.trim() || !form.address.city.trim() || !form.address.zip.trim()) {
      setError("Complete address is required.");
      return;
    }
    if (!form.industry) {
      setError("Industry is required.");
      return;
    }
    if (!form.employeeCount || parseInt(form.employeeCount, 10) < 1) {
      setError("Employee count must be at least 1.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        employeeCount: parseInt(form.employeeCount, 10),
      };

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save settings");
      }

      const updated = await res.json();
      setOrg(updated);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <div>
          <p className="font-medium">No organization found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete onboarding to set up your organization first.
          </p>
        </div>
        <Button asChild>
          <a href="/onboarding">Go to Onboarding</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your organization details and compliance settings.
        </p>
      </div>

      {/* Banners */}
      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/50 dark:text-green-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Organization Tab */}
      {activeTab === "organization" && (
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic details about your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => updateField("name", e.target.value)}
                    placeholder="Acme Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dba">DBA (Doing Business As)</Label>
                  <Input
                    id="dba"
                    value={form.dba}
                    onChange={(e) => updateField("dba", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    placeholder="admin@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Business Address
              </CardTitle>
              <CardDescription>
                Primary worksite location for your WVPP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address *</Label>
                <Input
                  id="street"
                  value={form.address.street}
                  onChange={(e) => updateAddress("street", e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={form.address.city}
                    onChange={(e) => updateAddress("city", e.target.value)}
                    placeholder="Los Angeles"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value="CA" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={form.address.zip}
                    onChange={(e) => updateAddress("zip", e.target.value)}
                    placeholder="90001"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Business Details
              </CardTitle>
              <CardDescription>
                Industry and workforce information used in your WVPP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry *</Label>
                  <Select
                    value={form.industry}
                    onValueChange={(val) => updateField("industry", val)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
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
                <div className="space-y-2">
                  <Label htmlFor="employeeCount">Employee Count *</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    min="1"
                    value={form.employeeCount}
                    onChange={(e) => updateField("employeeCount", e.target.value)}
                    placeholder="25"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Workplace Types</Label>
                <p className="text-sm text-muted-foreground">
                  Select all that apply to your business.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {WORKPLACE_TYPES.map((wt) => (
                    <label
                      key={wt.value}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={form.workplaceType.includes(wt.value)}
                        onCheckedChange={() => toggleWorkplaceType(wt.value)}
                      />
                      {wt.label}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Compliance Tab */}
      {activeTab === "compliance" && (
        <div className="space-y-6">
          {/* Compliance Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Compliance Status
              </CardTitle>
              <CardDescription>
                Current compliance tracking dates and status. These are updated automatically as you complete compliance activities.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <ComplianceField
                  label="WVPP Created"
                  value={formatDate(org.wvppCreatedAt)}
                  status={org.wvppCreatedAt ? "complete" : "missing"}
                />
                <ComplianceField
                  label="Last Plan Review"
                  value={formatDate(org.lastPlanReviewDate)}
                  status={org.lastPlanReviewDate ? "complete" : "missing"}
                />
                <ComplianceField
                  label="Next Plan Review Due"
                  value={formatDate(org.nextPlanReviewDueDate)}
                  status={getDateStatus(org.nextPlanReviewDueDate)}
                />
                <ComplianceField
                  label="Last Training Date"
                  value={formatDate(org.lastTrainingDate)}
                  status={org.lastTrainingDate ? "complete" : "missing"}
                />
                <ComplianceField
                  label="Next Training Due"
                  value={formatDate(org.nextTrainingDueDate)}
                  status={getDateStatus(org.nextTrainingDueDate)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription</CardTitle>
              <CardDescription>
                Your current plan and account tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-lg font-semibold">
                    {SUBSCRIPTION_PLANS[org.plan]?.name || "Free Trial"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {org.plan !== "free"
                      ? `$${SUBSCRIPTION_PLANS[org.plan]?.price}/month`
                      : "No active subscription"}
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <a href="/billing">Manage Billing</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Data & Retention */}
          <Card>
            <CardHeader>
              <CardTitle>Data Retention Policy</CardTitle>
              <CardDescription>
                Required retention periods per California Labor Code Section 6401.9.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <RetentionRow label="WVPP Documents" period="Current + 5 years" />
                <Separator />
                <RetentionRow label="Incident Logs" period="5 years" />
                <Separator />
                <RetentionRow label="Training Records" period="1 year minimum" />
                <Separator />
                <RetentionRow label="Hazard Assessments" period="5 years" />
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Account Created</p>
                  <p className="font-medium">{formatDate(org.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last Updated</p>
                  <p className="font-medium">{formatDate(org.updatedAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function ComplianceField({ label, value, status }) {
  const statusConfig = {
    complete: "text-green-600 dark:text-green-400",
    missing: "text-muted-foreground",
    overdue: "text-red-600 dark:text-red-400",
    upcoming: "text-yellow-600 dark:text-yellow-400",
  };

  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn("font-medium", statusConfig[status] || "")}>
        {value}
        {status === "missing" && (
          <span className="ml-2 text-xs font-normal">(Not yet completed)</span>
        )}
        {status === "overdue" && (
          <span className="ml-2 text-xs font-normal">(Overdue)</span>
        )}
      </p>
    </div>
  );
}

function RetentionRow({ label, period }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{period}</span>
    </div>
  );
}

function getDateStatus(dateStr) {
  if (!dateStr) return "missing";
  const date = new Date(dateStr);
  const now = new Date();
  if (date < now) return "overdue";
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (date - now < thirtyDays) return "upcoming";
  return "complete";
}
