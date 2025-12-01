"use client";

import { AppExperience } from "@/components/AppExperience";
import { AppStateProvider } from "@/components/AppStateProvider";

export default function DemoPage() {
  return (
    <AppStateProvider mode="demo">
      <AppExperience />
    </AppStateProvider>
  );
}
