"use client";

import { ReactNode } from "react";

// client-side providers shared by the dashboard (none needed after removing NextUI)
export default function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
