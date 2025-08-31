'use client';

import React from 'react';
import { Filter, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImportExportClients from './ImportExportClients';

interface NavbarSecondariaClientiProps {
  onRefresh?: () => void;
  onSortByScore?: (ascending: boolean) => void;
  onSortByName?: (ascending: boolean) => void;
  onSortByDate?: (ascending: boolean) => void;
  onClientsImported?: () => void;
}

const NavbarSecondariaClienti: React.FC<NavbarSecondariaClientiProps> = ({
  onRefresh,
  onSortByScore,
  onSortByName,
  onSortByDate,
  onClientsImported,
}) => {
  const [isAscending, setIsAscending] = React.useState(true);

  const handleSortToggle = (ascending: boolean) => {
    setIsAscending(ascending);
    onSortByScore?.(ascending);
  };

  const handleNameSort = (ascending: boolean) => {
    setIsAscending(ascending);
    onSortByName?.(ascending);
  };

  const handleDateSort = (ascending: boolean) => {
    setIsAscending(ascending);
    onSortByDate?.(ascending);
  };

  return (
    <div className="p-2 bg-white border-b border-gray-100 flex-none">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onRefresh?.()}
                  className="hover:bg-purple-50"
                >
                  <RefreshCw className="h-4 w-4 text-gray-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="text-xs">Aggiorna lista</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-2">
          {/* Import/Export component */}
          <ImportExportClients onClientsImported={onClientsImported} />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hover:bg-purple-50"
                    >
                      <Filter className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem
                      onClick={() => handleSortToggle(true)}
                      className="cursor-pointer"
                    >
                      Ordina per bontà (Crescente)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortToggle(false)}
                      className="cursor-pointer"
                    >
                      Ordina per bontà (Decrescente)
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => handleNameSort(true)}
                      className="cursor-pointer"
                    >
                      Ordina per nome (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNameSort(false)}
                      className="cursor-pointer"
                    >
                      Ordina per nome (Z-A)
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem
                      onClick={() => handleDateSort(true)}
                      className="cursor-pointer"
                    >
                      Ordina per data (Più recenti)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDateSort(false)}
                      className="cursor-pointer"
                    >
                      Ordina per data (Più vecchi)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span className="text-xs">Filtri e ordinamento</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default NavbarSecondariaClienti;
