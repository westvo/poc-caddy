"use client";

import { useState, useEffect } from "react";

export default function PerformanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPerformanceData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await fetch('/performance/dashboard');
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceData();
    const interval = setInterval(() => fetchPerformanceData(true), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '40px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Database Performance Dashboard</h1>
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>← Back to Home</a>
      </div>

      {loading && !data ? (
        <p style={{ color: '#6b7280' }}>Loading metrics...</p>
      ) : error ? (
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '8px' }}>Error: {error}</div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}>
          <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>Total Tables</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{data.tableCount}</p>
          </div>
          <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>Estimated Rows</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>{new Intl.NumberFormat().format(data.totalRows)}</p>
          </div>
          <div style={{ padding: '24px', backgroundColor: '#eff6ff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '13px', color: '#1e40af', marginBottom: '8px', fontWeight: '500' }}>DB Query Time</h3>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#1d4ed8', margin: 0 }}>{data.metrics.dbReadTimeMs.toFixed(2)} ms</p>
          </div>
          {data.server && (
            <>
              <div style={{ padding: '24px', backgroundColor: '#fdf2f8', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '13px', color: '#9d174d', marginBottom: '8px', fontWeight: '500' }}>CPU ({data.server.cpuCount} cores)</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#be185d', margin: 0 }}>{data.server.loadAvg1m.toFixed(2)} load</p>
                <p style={{ fontSize: '11px', color: '#831843', marginTop: '4px' }}>5m: {data.server.loadAvg5m.toFixed(2)} | 15m: {data.server.loadAvg15m.toFixed(2)}</p>
              </div>
              <div style={{ padding: '24px', backgroundColor: '#fffbeb', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '13px', color: '#b45309', marginBottom: '8px', fontWeight: '500' }}>RAM Usage</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#d97706', margin: 0 }}>{data.server.memUsagePercent.toFixed(1)}%</p>
                <p style={{ fontSize: '11px', color: '#92400e', marginTop: '4px' }}>
                  {(data.server.usedMemBytes / 1024 / 1024 / 1024).toFixed(2)} / {(data.server.totalMemBytes / 1024 / 1024 / 1024).toFixed(2)} GB
                </p>
              </div>
              <div style={{ padding: '24px', backgroundColor: '#f0fdf4', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <h3 style={{ fontSize: '13px', color: '#166534', marginBottom: '8px', fontWeight: '500' }}>API Latency</h3>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#15803d', margin: 0 }}>{data.metrics.totalApiTimeMs.toFixed(0)} ms</p>
              </div>
            </>
          )}
        </div>
      ) : null}

          <p style={{ color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}>
            Execute 1,000 random database queries concurrently to measure connection pool performance and throughput.
          </p>
          
          <button
            onClick={async () => {
              setStressLoading(true);
              setStressData(null);
              try {
                const res = await fetch('/performance/stress-test');
                const result = await res.json();
                if (result.success) setStressData(result.data);
              } catch (e) {
                console.error(e);
              } finally {
                setStressLoading(false);
              }
            }}
            disabled={stressLoading}
            style={{
              padding: '10px 20px', backgroundColor: stressLoading ? '#9ca3af' : '#dc2626', color: 'white', borderRadius: '6px',
              border: 'none', cursor: stressLoading ? 'not-allowed' : 'pointer', fontWeight: '600'
            }}
          >
            {stressLoading ? 'Running 1000 Queries...' : 'Run MySQL Test'}
          </button>

          {stressData && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Time</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{(stressData.totalTimeMs / 1000).toFixed(2)} s</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Throughput</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{stressData.throughputRps.toFixed(0)} req/s</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Success / Fail</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{stressData.successfulRequests} / <span style={{color: '#dc2626'}}>{stressData.failedRequests}</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Qdrant Stress Test */}
        <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Qdrant Stress Test</h2>
          <p style={{ color: '#4b5563', marginBottom: '16px', fontSize: '14px' }}>
            Execute 1,000 vector search API calls concurrently against the Qdrant database to measure vector search throughput.
          </p>
          
          <button
            onClick={async () => {
              setStressQdrantLoading(true);
              setStressQdrantData(null);
              try {
                const res = await fetch('/performance/stress-test-qdrant');
                const result = await res.json();
                if (result.success) setStressQdrantData(result.data);
              } catch (e) {
                console.error(e);
              } finally {
                setStressQdrantLoading(false);
              }
            }}
            disabled={stressQdrantLoading}
            style={{
              padding: '10px 20px', backgroundColor: stressQdrantLoading ? '#9ca3af' : '#7c3aed', color: 'white', borderRadius: '6px',
              border: 'none', cursor: stressQdrantLoading ? 'not-allowed' : 'pointer', fontWeight: '600'
            }}
          >
            {stressQdrantLoading ? 'Running 1000 Searches...' : 'Run Qdrant Test'}
          </button>

          {stressQdrantData && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Time</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{(stressQdrantData.totalTimeMs / 1000).toFixed(2)} s</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Throughput</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827' }}>{stressQdrantData.throughputRps.toFixed(0)} req/s</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>Success / Fail</p>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#166534' }}>{stressQdrantData.successfulRequests} / <span style={{color: '#dc2626'}}>{stressQdrantData.failedRequests}</span></p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
