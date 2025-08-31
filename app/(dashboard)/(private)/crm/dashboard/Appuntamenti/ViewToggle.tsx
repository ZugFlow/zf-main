import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Calendar, CalendarRange } from "lucide-react";

interface ViewToggleProps {
  isMonthlyView: boolean;
  setIsMonthlyView: (isMonthly: boolean) => void;
  isWeeklyView: boolean;
  setIsWeeklyView: (isWeekly: boolean) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ isMonthlyView, setIsMonthlyView, isWeeklyView, setIsWeeklyView }) => {
  const handleViewChange = (view: 'day' | 'week' | 'month') => {
    if (view === 'month') {
      setIsMonthlyView(true);
      setIsWeeklyView(false);
    } else if (view === 'week') {
      setIsMonthlyView(false);
      setIsWeeklyView(true);
    } else {
      setIsMonthlyView(false);
      setIsWeeklyView(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant={!isMonthlyView && !isWeeklyView ? "default" : "outline"}
        onClick={() => handleViewChange('day')}
      >
        <Calendar className="h-4 w-4" />
      </Button>
      <Button
        variant={isWeeklyView ? "default" : "outline"}
        onClick={() => handleViewChange('week')}
      >
        <CalendarRange className="h-4 w-4" />
      </Button>
      <Button
        variant={isMonthlyView ? "default" : "outline"}
        onClick={() => handleViewChange('month')}
      >
        <CalendarDays className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewToggle;
