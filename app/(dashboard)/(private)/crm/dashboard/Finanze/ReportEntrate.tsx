import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, DownloadIcon } from "lucide-react";
import { format } from "date-fns";

const ReportEntrate = () => {
  const [userId, setUserId] = useState("user1"); // Example user ID
  const [dailyData, setDailyData] = useState([
    { userId: "user1", date: "2025-01-01", client: "Andrea Rossi", amount: 120 },
    { userId: "user1", date: "2025-01-01", client: "Giulia Bianchi", amount: 200 },
    { userId: "user2", date: "2025-01-02", client: "Marco Verdi", amount: 150 },
  ]);

  const [monthlyData, setMonthlyData] = useState([
    { userId: "user1", month: "Gennaio", total: 470 },
    { userId: "user1", month: "Febbraio", total: 600 },
    { userId: "user2", month: "Marzo", total: 520 },
  ]);

  const [yearlyData, setYearlyData] = useState([
    { userId: "user1", year: "2024", total: 5000 },
    { userId: "user2", year: "2025", total: 1590 },
  ]);

  const [filters, setFilters] = useState({ daily: "", monthly: "", yearly: "" });

  const handleExport = () => {
    const csvContent = [
      ["Data", "Cliente", "Importo (€)"],
      ...dailyData.filter(data => data.userId === userId).map((data) => [data.date, data.client, data.amount]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `report_incassi_${format(new Date(), "yyyyMMdd")}.csv`;
    link.click();
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>, type: "daily" | "monthly" | "yearly") => {
    const { value } = e.target;
    setFilters({ ...filters, [type]: value });
  };

  const filteredDailyData = dailyData.filter((data) =>
    data.userId === userId && (!filters.daily || data.date.includes(filters.daily))
  );

  const filteredMonthlyData = monthlyData.filter((data) =>
    data.userId === userId && (!filters.monthly || data.month.includes(filters.monthly))
  );

  const filteredYearlyData = yearlyData.filter((data) =>
    data.userId === userId && (!filters.yearly || data.year.includes(filters.yearly))
  );

  return (
    <div className="p-6 bg-gray-100 h-screen flex flex-col gap-6">
      {/* Header Section */}
      <header className="bg-white shadow-md rounded-lg p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Report Incassi</h1>
        <Button variant="default" onClick={handleExport}>
          <DownloadIcon className="h-5 w-5 mr-2" /> Esporta CSV
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex flex-row gap-6 flex-1">
        {/* Daily Earnings Section */}
        <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
          <header className="p-4 bg-primary text-white font-bold text-lg">Incassi Giornalieri</header>
          <Separator />
          <div className="p-4">
            <input
              type="date"
              value={filters.daily}
              onChange={(e) => handleFilterChange(e, "daily")}
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="Filtra per data"
            />
          </div>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Importo (€)</th>
              </tr>
            </thead>
            <tbody>
              {filteredDailyData.map((data, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{data.date}</td>
                  <td className="px-4 py-3">{data.client}</td>
                  <td className="px-4 py-3">€ {data.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Monthly Earnings Section */}
        <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
          <header className="p-4 bg-primary text-white font-bold text-lg">Incassi Mensili</header>
          <Separator />
          <div className="p-4">
            <input
              type="text"
              value={filters.monthly}
              onChange={(e) => handleFilterChange(e, "monthly")}
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="Filtra per mese (es. Gennaio)"
            />
          </div>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Mese</th>
                <th className="px-4 py-3">Totale (€)</th>
              </tr>
            </thead>
            <tbody>
              {filteredMonthlyData.map((data, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{data.month}</td>
                  <td className="px-4 py-3">€ {data.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Yearly Earnings Section */}
        <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
          <header className="p-4 bg-primary text-white font-bold text-lg">Incassi Annuali</header>
          <Separator />
          <div className="p-4">
            <input
              type="text"
              value={filters.yearly}
              onChange={(e) => handleFilterChange(e, "yearly")}
              className="border rounded-lg p-2 text-sm w-full"
              placeholder="Filtra per anno (es. 2025)"
            />
          </div>
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-100 text-gray-800 font-semibold">
              <tr>
                <th className="px-4 py-3">Anno</th>
                <th className="px-4 py-3">Totale (€)</th>
              </tr>
            </thead>
            <tbody>
              {filteredYearlyData.map((data, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">{data.year}</td>
                  <td className="px-4 py-3">€ {data.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportEntrate;