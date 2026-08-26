"use client";

import { useState, useEffect } from "react";

export default function PerformanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiUrl}/performance/dashboard`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        setError("");
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Database Performance Dashboard</h1>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Back to Home</a>
      </div>

      <button
        onClick={fetchPerformanceData}
        style={{
          padding: '8px 16px', backgroundColor: '#10b981', color: 'white', borderRadius: '6px',
          border: 'none', cursor: 'pointer', marginBottom: '20px', fontWeight: '600'
        }}
      >
        Refresh Metrics
      </button>

      {loading ? (
        <p>Loading performance data...</p>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>
          Error: {error}
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Total Tables</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{data.tableCount}</p>
          </div>
          
          <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Estimated Total Rows</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>
              {new Intl.NumberFormat().format(data.totalRows)}
            </p>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#eff6ff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px' }}>DB Query Time (LIMIT 50)</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#1d4ed8' }}>
              {data.metrics.dbReadTimeMs.toFixed(2)} ms
            </p>
          </div>

          <div style={{ padding: '24px', backgroundColor: '#f0fdf4', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '14px', color: '#166534', marginBottom: '8px' }}>Total API Latency</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803d' }}>
              {data.metrics.totalApiTimeMs.toFixed(2)} ms
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
