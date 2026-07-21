import { useCallback } from "react";
import type { AccessibilityRole } from "react-native";
import { useEnforcedSettings } from "@/context/SettingsEnforcementContext";

type A11yTouchProps = {
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  accessibilityHint?: string;
  accessibilityState?: { selected?: boolean; disabled?: boolean; checked?: boolean };
};

export function useA11yProps() {
  const { a11y } = useEnforcedSettings();

  const a11yProps = useCallback(
    (
      label: string,
      options?: {
        role?: AccessibilityRole;
        hint?: string;
        disabled?: boolean;
        selected?: boolean;
        checked?: boolean;
        enabled?: boolean;
      }
    ): A11yTouchProps => {
      if (options?.enabled === false || !a11y.screenReaderHints) {
        return {};
      }
      const props: A11yTouchProps = {
        accessibilityLabel: label,
      };
      if (options?.role) props.accessibilityRole = options.role;
      if (options?.hint) props.accessibilityHint = options.hint;
      if (
        options?.disabled !== undefined ||
        options?.selected !== undefined ||
        options?.checked !== undefined
      ) {
        props.accessibilityState = {
          disabled: options?.disabled,
          selected: options?.selected,
          checked: options?.checked,
        };
      }
      return props;
    },
    [a11y.screenReaderHints]
  );

  return {
    a11y,
    a11yProps,
    fontScale: a11y.fontScale,
    hintsEnabled: a11y.screenReaderHints,
  };
}
