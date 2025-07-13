
"use client";

import * as React from "react";
import { useFormContext } from "react-hook-form";
import { CITIES } from "@/lib/cities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface CitySelectProps {
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

export function CitySelect({ onValueChange, defaultValue }: CitySelectProps) {
  // Check if the component is used inside a FormProvider
  const form = useFormContext();

  // If it's part of a form, wrap it in a FormControl to get form styling and context
  if (form) {
    return (
      <Select onValueChange={onValueChange} defaultValue={defaultValue}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a city" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {CITIES.map((city) => (
            <SelectItem key={city} value={city}>
              {city}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Otherwise, render it as a standalone Select component
  return (
    <Select onValueChange={onValueChange} defaultValue={defaultValue}>
      <SelectTrigger>
        <SelectValue placeholder="Select a city" />
      </SelectTrigger>
      <SelectContent>
        {CITIES.map((city) => (
          <SelectItem key={city} value={city}>
            {city}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
