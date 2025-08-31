'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarCarbon, Checkmark } from "@carbon/icons-react";

export default function TestDropdown() {
  const [daysToShow, setDaysToShow] = useState(4);

  const handleDaysToShowChange = (newDaysToShow: number) => {
    console.log('Test dropdown clicked - changing days to show from', daysToShow, 'to', newDaysToShow);
    setDaysToShow(newDaysToShow);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Test Dropdown</h2>
      <p className="mb-4">Current days to show: {daysToShow}</p>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => console.log('Test dropdown trigger clicked')}
          >
            <CalendarCarbon className="h-4 w-4" />
            <span>{daysToShow} giorni</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Giorni da visualizzare</h3>
            <p className="text-xs text-gray-600 mt-1">Seleziona quanti giorni mostrare</p>
          </div>
          <div className="p-2">
            {[1, 2, 3, 4, 5, 6, 7].map((num) => (
              <DropdownMenuItem
                key={num}
                onClick={() => handleDaysToShowChange(num)}
                className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                  daysToShow === num
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <CalendarCarbon className="h-4 w-4" />
                <span className="flex-1 font-medium text-sm">{num} {num === 1 ? 'giorno' : 'giorni'}</span>
                {daysToShow === num && (
                  <Checkmark className="h-4 w-4 text-blue-600" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 