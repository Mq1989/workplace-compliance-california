"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLES = [
  { value: "employee", label: "Employee" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
  { value: "wvpp_administrator", label: "WVPP Administrator" },
  { value: "owner", label: "Owner" },
];

const DEFAULT_FORM_DATA = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  jobTitle: "",
  role: "employee",
  hireDate: "",
};

function validate(formData) {
  if (!formData.firstName.trim()) return "First name is required.";
  if (!formData.lastName.trim()) return "Last name is required.";
  if (!formData.email.trim()) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
    return "Please enter a valid email address.";
  if (!formData.jobTitle.trim()) return "Job title is required.";
  if (!formData.hireDate) return "Hire date is required.";
  return null;
}

export default function EmployeeForm({ existingEmployee, onSuccess, onCancel }) {
  const isEditing = !!existingEmployee;

  const [formData, setFormData] = useState(() => {
    if (existingEmployee) {
      return {
        firstName: existingEmployee.firstName || "",
        lastName: existingEmployee.lastName || "",
        email: existingEmployee.email || "",
        phone: existingEmployee.phone || "",
        department: existingEmployee.department || "",
        jobTitle: existingEmployee.jobTitle || "",
        role: existingEmployee.role || "employee",
        hireDate: existingEmployee.hireDate
          ? new Date(existingEmployee.hireDate).toISOString().split("T")[0]
          : "",
      };
    }
    return DEFAULT_FORM_DATA;
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = isEditing
        ? `/api/employees/${existingEmployee._id}`
        : "/api/employees";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to save employee");
      }

      const employee = await res.json();
      onSuccess?.(employee);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => updateField("firstName", e.target.value)}
            placeholder="Jane"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => updateField("lastName", e.target.value)}
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => updateField("email", e.target.value)}
          placeholder="jane.doe@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => updateField("phone", e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="jobTitle">
            Job Title <span className="text-destructive">*</span>
          </Label>
          <Input
            id="jobTitle"
            value={formData.jobTitle}
            onChange={(e) => updateField("jobTitle", e.target.value)}
            placeholder="Sales Associate"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            value={formData.department}
            onChange={(e) => updateField("department", e.target.value)}
            placeholder="Sales"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={formData.role}
            onValueChange={(v) => updateField("role", v)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="Select role..." />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="hireDate">
            Hire Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="hireDate"
            type="date"
            value={formData.hireDate}
            onChange={(e) => updateField("hireDate", e.target.value)}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {isEditing ? "Update Employee" : "Add Employee"}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
