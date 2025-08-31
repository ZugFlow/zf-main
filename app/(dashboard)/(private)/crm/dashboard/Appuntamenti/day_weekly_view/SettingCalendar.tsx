import React, { useCallback, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";


const HOUR_HEIGHT_KEY = 'calendarHourHeight';
const MIN_HEIGHT = 175;
const MAX_HEIGHT = 800;

// Salva il valore nel localStorage
function saveCalendarHourHeight(height: number) {
  try {
    localStorage.setItem(HOUR_HEIGHT_KEY, String(height));
  } catch (e) {
    // opzionale: gestisci errori
  }
}

// Carica il valore dal localStorage
function loadCalendarHourHeight(): number | null {
  try {
    const value = localStorage.getItem(HOUR_HEIGHT_KEY);
    return value ? Number(value) : null;
  } catch (e) {
    return null;
  }
}

const SettingCalendar = ({ 
  hourHeight,
  setHourHeight,
  rowHeight = 200,
  setRowHeight,
  onTeamMemberChange, // Keep prop for compatibility
  selectedTeamMemberIds, // Keep prop for compatibility
  onRefresh, // Keep prop for compatibility
}: { 
  hourHeight: number;
  setHourHeight: (height: number) => void;
  rowHeight: number;
  setRowHeight: (height: number) => void;
  onTeamMemberChange?: (value: string[]) => void;
  selectedTeamMemberIds?: string[];
  onRefresh?: () => void;
}) => {
  // Usa il valore salvato se presente, altrimenti quello di default
  const [localHeight, setLocalHeight] = useState(() => {
    const saved = loadCalendarHourHeight();
    return saved !== null ? saved : hourHeight;
  });

  const handleHourHeightChange = useCallback((newHeight: number) => {
    setLocalHeight(newHeight);
  }, []);

  const applyChanges = () => {
    setHourHeight(localHeight);
    saveCalendarHourHeight(localHeight);
  }

  const handleSliderChange = (value: number[]) => {
    handleHourHeightChange(value[0]);
  };

  const incrementHeight = () => {
    const newHeight = Math.min(localHeight + 20, MAX_HEIGHT);
    handleHourHeightChange(newHeight);
  };

  const decrementHeight = () => {
    const newHeight = Math.max(localHeight - 20, MIN_HEIGHT);
    handleHourHeightChange(newHeight);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          Impostazioni Calendario 
          <Badge variant="outline" className="ml-2 bg-purple-50">Zoom</Badge>
        </CardTitle>
        <CardDescription>
          Personalizza la visualizzazione del calendario
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label htmlFor="zoom-level" className="mb-2 block text-sm font-medium">
              Livello di zoom: <span className="text-purple-600 font-bold">{localHeight}px</span>
            </Label>
            
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={decrementHeight}
                disabled={localHeight <= MIN_HEIGHT}
              >
                <Minus className="h-4 w-4" />
              </Button>
              
              <div className="w-full">
                <Slider 
                  id="zoom-level"
                  defaultValue={[localHeight]}
                  min={MIN_HEIGHT}
                  max={MAX_HEIGHT}
                  step={5}
                  onValueChange={handleSliderChange}
                  className="w-full"
                />
              </div>
              
              <Button 
                variant="outline" 
                size="icon" 
                onClick={incrementHeight}
                disabled={localHeight >= MAX_HEIGHT}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
              <span>Minimo ({MIN_HEIGHT}px)</span>
              <span>Massimo ({MAX_HEIGHT}px)</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              min={MIN_HEIGHT}
              max={MAX_HEIGHT}
              value={localHeight}
              onChange={(e) => handleHourHeightChange(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-sm text-gray-500">Valore manuale (px)</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        )}
        <Button onClick={applyChanges} className="ml-auto">
          Applica
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SettingCalendar;
