"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  CalendarDays,
  Shield,
  GraduationCap,
  FileCheck,
  Pencil,
  UserX,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import EmployeeForm from "@/components/forms/EmployeeForm";

const ROLE_CONFIG = {
  employee: {
    label: "Employee",
    className:
      "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  },
  supervisor: {
    label: "Supervisor",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  },
  manager: {
    label: "Manager",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  },
  wvpp_administrator: {
    label: "WVPP Admin",
    className:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  },
  owner: {
    label: "Owner",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
};

function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.employee;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        isActive
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      )}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function formatDate(dateString) {
  if (!dateString) return "\u2014";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Section({ title, icon: Icon, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}</span>
      <p className="font-medium">{value || "\u2014"}</p>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { employeeId } = useParams();
  const router = useRouter();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`/api/employees/${employeeId}`);
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || "Failed to load employee");
        }
        const data = await res.json();
        setEmployee(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployee();
  }, [employeeId]);

  function handleEditSuccess(updated) {
    setEmployee(updated);
    setEditing(false);
  }

  async function handleDeactivate() {
    setDeactivating(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to deactivate employee");
      }
      router.push("/employees");
    } catch (err) {
      setError(err.message);
      setShowDeactivateDialog(false);
    } finally {
      setDeactivating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !employee) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/employees">Back to Employees</Link>
        </Button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(false)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Employee</h1>
        </div>
        <Card>
          <CardContent className="pt-6">
            <EmployeeForm
              existingEmployee={employee}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditing(false)}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const emp = employee;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/employees">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {emp.firstName} {emp.lastName}
              </h1>
              <RoleBadge role={emp.role} />
              <StatusBadge isActive={emp.isActive} />
            </div>
            <p className="text-sm text-muted-foreground">{emp.jobTitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
          {emp.isActive && (
            <Button
              variant="destructive"
              onClick={() => setShowDeactivateDialog(true)}
            >
              <UserX className="h-4 w-4" />
              Deactivate
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Employee Sections */}
      <div className="grid gap-4">
        {/* Contact Information */}
        <Section title="Contact Information" icon={User}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Email</span>
                <p className="font-medium">{emp.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-muted-foreground">Phone</span>
                <p className="font-medium">{emp.phone || "\u2014"}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Employment Details */}
        <Section title="Employment Details" icon={Briefcase}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DetailRow label="Job Title" value={emp.jobTitle} />
            <DetailRow label="Department" value={emp.department} />
            <DetailRow
              label="Role"
              value={
                (ROLE_CONFIG[emp.role] || ROLE_CONFIG.employee).label
              }
            />
            <DetailRow label="Hire Date" value={formatDate(emp.hireDate)} />
          </div>
          {!emp.isActive && (
            <div className="border-t pt-3">
              <DetailRow
                label="Termination Date"
                value={formatDate(emp.terminationDate)}
              />
            </div>
          )}
        </Section>

        {/* Training & Compliance */}
        <Section title="Training & Compliance" icon={GraduationCap}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailRow
              label="Initial Training Completed"
              value={formatDate(emp.initialTrainingCompletedAt)}
            />
            <DetailRow
              label="Last Annual Training"
              value={formatDate(emp.lastAnnualTrainingCompletedAt)}
            />
            <DetailRow
              label="Next Training Due"
              value={formatDate(emp.nextTrainingDueDate)}
            />
          </div>
          {emp.nextTrainingDueDate && new Date(emp.nextTrainingDueDate) < new Date() && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-destructive">
                Training is overdue. Next training was due{" "}
                {formatDate(emp.nextTrainingDueDate)}.
              </p>
            </div>
          )}
        </Section>

        {/* WVPP Acknowledgment */}
        <Section title="WVPP Acknowledgment" icon={FileCheck}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow
              label="Acknowledged At"
              value={formatDate(emp.wvppAcknowledgedAt)}
            />
            <DetailRow
              label="Plan Version"
              value={
                emp.wvppAcknowledgedVersion
                  ? `v${emp.wvppAcknowledgedVersion}`
                  : undefined
              }
            />
          </div>
          {!emp.wvppAcknowledgedAt && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
              <Shield className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                This employee has not yet acknowledged the WVPP.
              </p>
            </div>
          )}
        </Section>

        {/* System Info */}
        <Section title="Record Information" icon={CalendarDays}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailRow label="Created" value={formatDate(emp.createdAt)} />
            <DetailRow
              label="Last Updated"
              value={formatDate(emp.updatedAt)}
            />
          </div>
        </Section>
      </div>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deactivate Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to deactivate{" "}
              <span className="font-semibold">
                {emp.firstName} {emp.lastName}
              </span>
              ? This will mark them as inactive and set today as their
              termination date. This action can be undone by editing the
              employee record.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeactivateDialog(false)}
              disabled={deactivating}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              {deactivating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deactivating...
                </>
              ) : (
                <>
                  <UserX className="h-4 w-4" />
                  Deactivate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
