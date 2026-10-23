import { useCallback } from "react";

import { toast } from "sonner";

import { sanitizeCustomizationState } from "@/constants/workspace";
import { downloadBlob } from "@/lib/download";
import { CustomizationState } from "@/lib/types";

export function useConfigPersistence(
  state: CustomizationState,
  onChange: (updates: Partial<CustomizationState>) => void,
) {
  const handleExport = useCallback(() => {
    try {
      const now = new Date();
      const timestamp = now.toISOString().replace(/T/, "_").replace(/\..+/, "").replace(/:/g, "-");
      downloadBlob(
        JSON.stringify(state, null, 2),
        `runeiconcustomization-${timestamp}.json`,
        "application/json",
      );
      toast.success("Configuration exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export configuration");
    }
  }, [state]);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,application/json";

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const importedState = JSON.parse(content);

          if (
            importedState &&
            typeof importedState === "object" &&
            ("colors" in importedState || "shadow" in importedState)
          ) {
            onChange(sanitizeCustomizationState(importedState));
            toast.success("Configuration imported successfully");
          } else {
            toast.error("Invalid configuration file");
          }
        } catch (error) {
          console.error("Import failed:", error);
          toast.error("Failed to parse configuration file");
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }, [onChange]);

  return { handleExport, handleImport };
}
