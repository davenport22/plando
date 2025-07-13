
"use client";

import * as React from "react";
import { CITIES } from "@/lib/cities";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface CitySelectProps {
  onValueChange: (value: string) => void;
  defaultValue?: string;
}

export function CitySelect({ onValueChange, defaultValue }: CitySelectProps) {
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
