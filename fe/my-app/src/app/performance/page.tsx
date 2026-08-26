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
        <a href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: '14px' }}>Back to Home</a>
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

      <StressSection />
    </div>
  );
}

function StressSection() {
  const [mysqlRunning, setMysqlRunning] = useState(false);
  const [mysqlData, setMysqlData] = useState<any>(null);
  const [mysqlRound, setMysqlRound] = useState(0);
  const [mysqlTimerId, setMysqlTimerId] = useState<any>(null);

  const [qdrantRunning, setQdrantRunning] = useState(false);
  const [qdrantData, setQdrantData] = useState<any>(null);
  const [qdrantRound, setQdrantRound] = useState(0);
  const [qdrantTimerId, setQdrantTimerId] = useState<any>(null);

  const runMysql = async () => {
    try {
      const res = await fetch('/performance/stress-test');
      const r = await res.json();
      if (r.success) { setMysqlData(r.data); setMysqlRound(n => n + 1); }
    } catch (e) {}
  };

  const startMysql = () => {
    setMysqlRound(0);
    setMysqlRunning(true);
    runMysql();
    const id = setInterval(runMysql, 1000);
    setMysqlTimerId(id);
  };

  const stopMysql = () => {
    setMysqlRunning(false);
    clearInterval(mysqlTimerId);
    setMysqlTimerId(null);
  };

  const runQdrant = async () => {
    try {
      const res = await fetch('/performance/stress-test-qdrant');
      const r = await res.json();
      if (r.success) { setQdrantData(r.data); setQdrantRound(n => n + 1); }
    } catch (e) {}
  };

  const startQdrant = () => {
    setQdrantRound(0);
    setQdrantRunning(true);
    runQdrant();
    const id = setInterval(runQdrant, 1000);
    setQdrantTimerId(id);
  };

  const stopQdrant = () => {
    setQdrantRunning(false);
    clearInterval(qdrantTimerId);
    setQdrantTimerId(null);
  };

  useEffect(() => {
    return () => {
      if (mysqlTimerId) clearInterval(mysqlTimerId);
      if (qdrantTimerId) clearInterval(qdrantTimerId);
    };
  }, [mysqlTimerId, qdrantTimerId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
      <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>MySQL Stress Test</h2>
          {mysqlRunning && (
            <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
              Round {mysqlRound}
            </span>
          )}
        </div>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
          1,000 queries vao 10 random tables moi giay. Tu lap den khi nhan Stop.
        </p>
        {!mysqlRunning ? (
          <button onClick={startMysql} style={{ padding: '10px 20px', backgroundColor: '#dc2626', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            Start MySQL Test
          </button>
        ) : (
          <button onClick={stopMysql} style={{ padding: '10px 20px', backgroundColor: '#374151', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            Stop
          </button>
        )}
        {mysqlData && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div><p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0' }}>Total Time</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{(mysqlData.totalTimeMs / 1000).toFixed(2)} s</p></div>
            <div><p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0' }}>Throughput</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{mysqlData.throughputRps.toFixed(0)} req/s</p></div>
            <div><p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0' }}>Success / Fail</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}><span style={{ color: '#16a34a' }}>{mysqlData.successfulRequests}</span> / <span style={{ color: '#dc2626' }}>{mysqlData.failedRequests}</span></p></div>
          </div>
        )}
      </div>

      <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>Qdrant Stress Test</h2>
          {qdrantRunning && (
            <span style={{ fontSize: '11px', backgroundColor: '#f3e8ff', color: '#7c3aed', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' }}>
              Round {qdrantRound}
            </span>
          )}
        </div>
        <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '16px' }}>
          1,000 vector search (768d) vao Qdrant moi giay. Tu lap den khi nhan Stop.
        </p>
        {!qdrantRunning ? (
          <button onClick={startQdrant} style={{ padding: '10px 20px', backgroundColor: '#7c3aed', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            Start Qdrant Test
          </button>
        ) : (
          <button onClick={stopQdrant} style={{ padding: '10px 20px', backgroundColor: '#374151', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
            Stop
          </button>
        )}
        {qdrantData && (
          <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div><p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0' }}>Total Time</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{(qdrantData.totalTimeMs / 1000).toFixed(2)} s</p></div>
            <div><p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0' }}>Throughput</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{qdrantData.throughputRps.toFixed(0)} req/s</p></div>
            <div><p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 2px 0' }}>Success / Fail</p><p style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}><span style={{ color: '#16a34a' }}>{qdrantData.successfulRequests}</span> / <span style={{ color: '#dc2626' }}>{qdrantData.failedRequests}</span></p></div>
          </div>
        )}
      </div>
    </div>
  );
}
