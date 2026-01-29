"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Loader2,
  AlertCircle,
  Search,
  Mail,
  Briefcase,
  Building2,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeFilter) params.set("active", activeFilter);
      if (roleFilter && roleFilter !== "all") params.set("role", roleFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to load employees");
      }
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [activeFilter, roleFilter, searchQuery]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  function handleEmployeeAdded() {
    setShowAddDialog(false);
    fetchEmployees();
  }

  if (error && employees.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <p className="mt-4 text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => {
            setError("");
            fetchEmployees();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage your employee roster and track training compliance.
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, title, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={activeFilter} onValueChange={setActiveFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="employee">Employee</SelectItem>
            <SelectItem value="supervisor">Supervisor</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="wvpp_administrator">WVPP Admin</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && employees.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              {searchQuery || roleFilter !== "all" || activeFilter === "false" ? (
                <UserX className="h-7 w-7 text-primary" />
              ) : (
                <Users className="h-7 w-7 text-primary" />
              )}
            </div>
            <h2 className="mt-4 text-lg font-semibold">
              {searchQuery || roleFilter !== "all" || activeFilter === "false"
                ? "No employees match your filters"
                : "No employees yet"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || roleFilter !== "all" || activeFilter === "false"
                ? "Try adjusting your search or filter criteria."
                : "Add employees to track training compliance and manage your team."}
            </p>
            {!searchQuery && roleFilter === "all" && activeFilter === "true" && (
              <Button className="mt-6" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" />
                Add First Employee
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Employee list */}
      {!loading && employees.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {employees.length} employee{employees.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-4">
            {employees.map((emp) => (
              <Card key={emp._id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-base">
                      {emp.firstName} {emp.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" />
                      {emp.jobTitle}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <RoleBadge role={emp.role} />
                    <StatusBadge isActive={emp.isActive} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{emp.department || "No department"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Hire Date: </span>
                      <span className="font-medium">
                        {formatDate(emp.hireDate)}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/employees/${emp._id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
          </DialogHeader>
          <EmployeeForm
            onSuccess={handleEmployeeAdded}
            onCancel={() => setShowAddDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
