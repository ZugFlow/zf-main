import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { addMonths, format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function MiniCalendar() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentDate(prev => addMonths(prev, -1))}
        >
          <ChevronLeftIcon />
        </Button>
        <span className="font-semibold">
          {format(currentDate, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
          <div key={day} className="text-gray-500">{day}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => (
          <Button
            key={day.toISOString()}
            variant="ghost"
            size="sm"
            className={`h-8 p-0 ${
              isToday(day) ? 'bg-blue-100 text-blue-600' : ''
            } ${
              !isSameMonth(day, currentDate) ? 'text-gray-300' : ''
            }`}
          >
            {format(day, 'd')}
          </Button>
        ))}
      </div>
    </div>
  );
}
