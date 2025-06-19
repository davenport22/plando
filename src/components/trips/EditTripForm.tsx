
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DialogClose } from "@/components/ui/dialog";
import { cn, calculateTripDuration } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Loader2, Save } from "lucide-react";
import { useState, useEffect } from "react";
import type { Trip } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

const editTripFormSchema = z.object({
  name: z.string().min(3, "Trip name must be at least 3 characters.").max(50, "Trip name must be at most 50 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters.").max(100, "Destination must be at most 100 characters."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  placeId: z.string().optional(),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type EditTripFormValues = z.infer<typeof editTripFormSchema>;

interface EditTripFormProps {
  currentTrip: Trip;
  onSubmit: (data: Partial<Omit<Trip, 'id' | 'ownerId' | 'participantIds' | 'imageUrl'>>) => Promise<void>;
}

export function EditTripForm({ currentTrip, onSubmit }: EditTripFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [durationDisplay, setDurationDisplay] = useState<string>("");

  const form = useForm<EditTripFormValues>({
    resolver: zodResolver(editTripFormSchema),
    defaultValues: {
      name: currentTrip.name,
      destination: currentTrip.destination,
      startDate: currentTrip.startDate ? parseISO(currentTrip.startDate) : new Date(),
      endDate: currentTrip.endDate ? parseISO(currentTrip.endDate) : new Date(),
      latitude: currentTrip.latitude,
      longitude: currentTrip.longitude,
      placeId: currentTrip.placeId,
    },
  });
  
  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  useEffect(() => {
    if (currentTrip.startDate && currentTrip.endDate) {
      const initialDuration = calculateTripDuration(
        currentTrip.startDate, 
        currentTrip.endDate
      );
      setDurationDisplay(initialDuration);
    }
  }, [currentTrip.startDate, currentTrip.endDate]);


  useEffect(() => {
    if (startDate && endDate && endDate >= startDate) {
      const duration = calculateTripDuration(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );
      setDurationDisplay(duration);
    } else {
      setDurationDisplay("");
    }
  }, [startDate, endDate]);


  useEffect(() => {
    form.reset({
      name: currentTrip.name,
      destination: currentTrip.destination,
      startDate: currentTrip.startDate ? parseISO(currentTrip.startDate) : new Date(),
      endDate: currentTrip.endDate ? parseISO(currentTrip.endDate) : new Date(),
      latitude: currentTrip.latitude,
      longitude: currentTrip.longitude,
      placeId: currentTrip.placeId,
    });
  }, [currentTrip, form]);

  async function handleFormSubmit(data: EditTripFormValues) {
    setIsLoading(true);
    
    // Simulate updating geo data if destination changed, or retain existing
    const destinationChanged = data.destination !== currentTrip.destination;
    const updatedLatitude = destinationChanged && data.destination ? 34.0522 : (data.latitude ?? currentTrip.latitude); // Example: LA Latitude
    const updatedLongitude = destinationChanged && data.destination ? -118.2437 : (data.longitude ?? currentTrip.longitude); // Example: LA Longitude
    const updatedPlaceId = destinationChanged && data.destination ? "mock-place-id-456" : (data.placeId ?? currentTrip.placeId); // Example Place ID
    
    const updatedData = {
        ...data,
        latitude: updatedLatitude,
        longitude: updatedLongitude,
        placeId: updatedPlaceId,
    };

    await onSubmit({ 
        ...updatedData,
        startDate: format(updatedData.startDate, 'yyyy-MM-dd'),
        endDate: format(updatedData.endDate, 'yyyy-MM-dd'),
    });
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summer in Italy" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Rome, Italy" {...field} />
              </FormControl>
              <FormDescription>
                Where are you planning to go? In a full implementation, this would use a map-based place selector to get precise location data.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < (form.getValues("startDate") || new Date(new Date().setHours(0,0,0,0)))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {durationDisplay && (
          <p className="text-sm text-muted-foreground -mt-4 md:col-span-2">
            Trip duration: {durationDisplay}
          </p>
        )}

        <Alert variant="default" className="bg-muted/50">
          <Info className="h-5 w-5" />
          <AlertTitle className="font-semibold">Participant Management</AlertTitle>
          <AlertDescription>
            Adding or removing participants will be available in a future update.
          </AlertDescription>
        </Alert>
        
        <DialogClose asChild>
          <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </DialogClose>
      </form>
    </Form>
  );
}
