import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";

export const Route = createFileRoute("/")({
  component: () => <AppShell />,
  // Render Dashboard as the index via wrapper
});
