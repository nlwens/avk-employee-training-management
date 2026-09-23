"use client";

import * as React from "react";

import { Checkbox } from "@ui/components/ui/checkbox";
import { Label } from "@ui/components/ui/label";
import { cn } from "@ui/lib/utils";

interface CheckboxOptionProps {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onBlur?: React.FocusEventHandler<HTMLButtonElement>;
  name?: string;
  className?: string;
}

const CheckboxOption = React.forwardRef<
  React.ElementRef<typeof Checkbox>,
  CheckboxOptionProps
>(({ id, label, checked, onCheckedChange, onBlur, name, className }, ref) => (
  <div className={cn("flex items-center gap-2", className)}>
    <Checkbox
      id={id}
      ref={ref}
      name={name}
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      onBlur={onBlur}
    />
    <Label htmlFor={id} className="font-normal">
      {label}
    </Label>
  </div>
));

CheckboxOption.displayName = "CheckboxOption";

export { CheckboxOption };
