
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, calculateTripDuration } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, Info, X, PlusCircle, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createTrip } from "@/lib/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CityAutocompleteInput } from "@/components/common/CityAutocompleteInput";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

const newTripFormSchema = z.object({
  name: z.string().min(3, "Trip name must be at least 3 characters.").max(50, "Trip name must be at most 50 characters."),
  destination: z.string().min(2, "Destination must be at least 2 characters.").max(100, "Destination must be at most 100 characters."),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  itineraryGenerationRule: z.enum(['majority', 'all']).default('majority'),
  participantEmails: z.array(z.string().email()).optional(),
  syncLocalActivities: z.boolean().default(true),
}).refine(data => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"],
});

type NewTripFormValues = z.infer<typeof newTripFormSchema>;

export function NewTripForm() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [durationDisplay, setDurationDisplay] = useState<string>("");

  const [emails, setEmails] = useState<string[]>([]);
  const [currentEmail, setCurrentEmail] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/');
    }
  }, [user, router]);

  const form = useForm<NewTripFormValues>({
    resolver: zodResolver(newTripFormSchema),
    defaultValues: {
      name: "",
      destination: "",
      itineraryGenerationRule: "majority",
      participantEmails: [],
      syncLocalActivities: true,
    },
  });

  const { setValue } = form;
  useEffect(() => {
      setValue('participantEmails', emails);
  }, [emails, setValue]);

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

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

  const handleAddEmail = () => {
    const emailValidation = z.string().email().safeParse(currentEmail);
    if (currentEmail && emailValidation.success && !emails.includes(currentEmail) && currentEmail.toLowerCase() !== user?.email?.toLowerCase()) {
      setEmails([...emails, currentEmail]);
      setCurrentEmail('');
    } else if (currentEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast({ title: "You are already on the trip!", description: "You don't need to invite yourself.", variant: "default" });
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setEmails(emails.filter(email => email !== emailToRemove));
  };


  async function onSubmit(data: NewTripFormValues) {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to create a trip.", variant: "destructive"});
        return;
    }

    setIsLoading(true);
    
    try {
        const tripData = {
          name: data.name,
          destination: data.destination,
          startDate: format(data.startDate, "yyyy-MM-dd"),
          endDate: format(data.endDate, "yyyy-MM-dd"),
          itineraryGenerationRule: data.itineraryGenerationRule,
          participantEmails: data.participantEmails,
          syncLocalActivities: data.syncLocalActivities,
        };

        const result = await createTrip(tripData, user.uid);

        if (result.success && result.tripId) {
          toast({
            title: "Trip Created!",
            description: `Your trip "${data.name}" has been saved.`,
          });
          router.push(`/trips/${result.tripId}`);
        } else {
          toast({
            title: "Error Creating Trip",
            description: result.error,
            variant: "destructive",
          });
          setIsLoading(false);
        }
    } catch (error) {
        toast({
            title: "An Unexpected Error Occurred",
            description: "Could not create trip. Please try again.",
            variant: "destructive",
        });
        setIsLoading(false);
    }
  }

  if (!user) {
    return (
        <div className="flex items-center justify-center p-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <p>Redirecting to login...</p>
        </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trip Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Summer in Italy" {...field} />
              </FormControl>
              <FormDescription>Give your trip a memorable name.</FormDescription>
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
                <CityAutocompleteInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="e.g., Rome, Italy"
                />
              </FormControl>
              <FormDescription>
                Where are you planning to go?
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>City Trips Focus</AlertTitle>
          <AlertDescription>
            Plando is currently optimized for city-based trips. Please enter a major city as your destination.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                          "w-full pl-3 text-left font-normal",
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
                      disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) } 
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
                          "w-full pl-3 text-left font-normal",
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
          <p className="text-sm text-muted-foreground -mt-4">
            Trip duration: {durationDisplay}
          </p>
        )}

        <Separator />
        
        <FormField
          control={form.control}
          name="itineraryGenerationRule"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Itinerary Generation Rule</FormLabel>
              <FormDescription>
                Choose how activities qualify for the automatic itinerary.
              </FormDescription>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="majority" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Majority of Voters Like It (with >50% participation)
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="all" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      All Participants Must Like It
                    </FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <FormField
          control={form.control}
          name="syncLocalActivities"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Include Local Discovery Activities
                </FormLabel>
                <FormDescription>
                  Automatically include activities from other Plando modules for your destination.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <Separator />

        <div>
            <FormLabel>Invite Participants (Optional)</FormLabel>
            <FormDescription>
                Add people to your trip by email. Existing users will be added, new users will receive an invitation.
            </FormDescription>
            <div className="flex items-center gap-2 mt-4">
                <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={currentEmail}
                    onChange={(e) => setCurrentEmail(e.target.value)}
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddEmail(); }}}
                />
                <Button type="button" onClick={handleAddEmail}>Add</Button>
            </div>
            <div className="space-y-2 mt-4">
                {emails.map((email, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                        <span>{email}</span>
                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveEmail(email)}>
                            <X className="h-4 w-4" aria-label={`Remove ${email}`} />
                        </Button>
                    </div>
                ))}
            </div>
        </div>

        <FormField
          control={form.control}
          name="participantEmails"
          render={({ field }) => (
              <FormItem className="hidden">
                  <FormControl>
                      <Input type="hidden" {...field} />
                  </FormControl>
              </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          Create Trip
        </Button>
      </form>
    </Form>
  );
}
