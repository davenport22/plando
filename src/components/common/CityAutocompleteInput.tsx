
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover";
import { CITIES } from "@/lib/cities";

interface CityAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function CityAutocompleteInput({
  value,
  onChange,
  placeholder = "e.g., Paris, France",
  disabled = false,
}: CityAutocompleteInputProps) {
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    onChange(inputValue);

    if (inputValue.length > 1) {
      const filteredCities = CITIES.filter((city) =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filteredCities.slice(0, 5)); // Show top 5 suggestions
      setIsOpen(filteredCities.length > 0 && document.activeElement === event.target);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };
  
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
     if (inputValue.length > 1) {
      const filteredCities = CITIES.filter((city) =>
        city.toLowerCase().includes(inputValue.toLowerCase())
      );
      setSuggestions(filteredCities.slice(0, 5));
      setIsOpen(filteredCities.length > 0);
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
          autoComplete="off"
        />
      </PopoverAnchor>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()} // prevent focus stealing
      >
        <ul className="max-h-60 overflow-y-auto">
          {suggestions.map((city) => (
            <li
              key={city}
              className="cursor-pointer p-2 hover:bg-accent hover:text-accent-foreground text-sm"
              onMouseDown={(e) => {
                // use onMouseDown to fire before onBlur from input
                e.preventDefault();
                handleSuggestionClick(city);
              }}
            >
              {city}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
