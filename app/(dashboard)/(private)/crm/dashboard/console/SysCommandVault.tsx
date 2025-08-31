"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const SysCommandVault = () => {
  const [logs, setLogs] = useState(["Logs will appear here..."]);

  const handleRefresh = () => {
    setLogs((prevLogs) => [
      ...prevLogs,
      "[INFO] Logs refreshed at " + new Date().toLocaleTimeString(),
    ]);
  };

  const handleClear = () => {
    setLogs(["Logs cleared."]);
  };

  const handleExport = () => {
    console.log("Logs exported", logs);
  };

  const simulateDbError = () => {
    setLogs((prevLogs) => [
      ...prevLogs,
      "[ERROR] Database communication error at " + new Date().toLocaleTimeString(),
    ]);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>System Monitoring Dashboard</h1>

      {/* Section for Recent Errors */}
      <section style={{ marginBottom: '20px' }}>
        <h2>Recent Errors</h2>
        <ul>
          <li>No errors found.</li>
        </ul>
      </section>

      {/* Section for Warnings */}
      <section style={{ marginBottom: '20px' }}>
        <h2>Warnings</h2>
        <ul>
          <li>No warnings found.</li>
        </ul>
      </section>

      {/* Section for Service Status */}
      <section style={{ marginBottom: '20px' }}>
        <h2>Service Status</h2>
        <ul>
          <li>All services are operational.</li>
        </ul>
      </section>

      {/* Section for Detailed Logs */}
      <section>
        <h2>Detailed Logs</h2>
        <textarea
          style={{ width: '100%', height: '200px', marginBottom: '10px' }}
          readOnly
          value={logs.join("\n")}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={handleRefresh}>Refresh Logs</Button>
          <Button onClick={handleClear}>Clear Logs</Button>
          <Button onClick={handleExport}>Export Logs</Button>
          <Button onClick={simulateDbError}>Simulate DB Error</Button>
        </div>
      </section>
    </div>
  );
};

export default SysCommandVault;