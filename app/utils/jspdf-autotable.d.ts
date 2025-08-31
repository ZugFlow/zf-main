// src/types/jspdf-autotable.d.ts
import 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}
