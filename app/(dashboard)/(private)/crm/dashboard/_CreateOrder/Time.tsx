import React from "react";
import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

// Funzione per generare orari ogni 5 minuti
const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      timeSlots.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return timeSlots;
};

const timeSlots = generateTimeSlots();

interface TimeSectionProps {
  form: UseFormReturn<any>;
  modalSettings?: any;
}

export function TimeSection({ form, modalSettings }: TimeSectionProps) {
  // Use modal settings for labels and visibility
  const sectionTitle = modalSettings?.time_section_title || 'Data e Orario';
  const dateLabel = modalSettings?.date_label || 'Data';
  const startTimeLabel = modalSettings?.start_time_label || 'Orario Inizio';
  const endTimeLabel = modalSettings?.end_time_label || 'Orario Fine';
  const timePlaceholder = modalSettings?.time_placeholder || 'Seleziona orario';

  // Check if time section should be visible
  if (modalSettings && (modalSettings.show_time_section === false || modalSettings.show_time_section === "false")) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{sectionTitle}</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="data"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{dateLabel}</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="text-sm" />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orarioInizio"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{startTimeLabel}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={timePlaceholder} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="orarioFine"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">{endTimeLabel}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder={timePlaceholder} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px] overflow-y-auto">
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
