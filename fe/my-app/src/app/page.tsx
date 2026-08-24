"use client";

import { useState, useEffect } from "react";

type CustomDomain = {
  id: string;
  hostname: string;
  status: "pending" | "verified" | "failed";
  verification_token?: string;
  verification_method?: "txt" | "file";
  verified_at?: string;
  created_at: string;
  updated_at: string;
  last_error?: string;
};

type DnsInstructions = {
  hostname: string;
  status: string;
  verification_token: string;
  verification_method: string;
  server_ip?: string;
  instructions: {
    txt_record?: { name: string; type: string; value: string };
    file_verification?: { url: string; content: string };
  };
};

export default function Home() {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [hostname, setHostname] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"txt" | "file">("txt");
  const [selectedDomain, setSelectedDomain] = useState<CustomDomain | null>(null);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstructions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const response = await fetch("/custom-domains");
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      }
    } catch (err) {
      console.error("Failed to fetch domains:", err);
    }
  };

  const createDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/custom-domains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hostname,
          verification_method: verificationMethod,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setDomains([data, ...domains]);
        setHostname("");
        fetchDnsInstructions(data.id);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create domain");
      }
    } catch (err) {
      setError("Failed to create domain");
    } finally {
      setLoading(false);
    }
  };

  const verifyDomain = async (id: string) => {
    try {
      const response = await fetch(`/custom-domains/${id}/verify`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ok) {
          fetchDomains();
          setError("");
        } else {
          setError(data.reason || "Verification failed");
        }
      }
    } catch (err) {
      setError("Failed to verify domain");
    }
  };

  const fetchDnsInstructions = async (id: string) => {
    try {
      const response = await fetch(`/custom-domains/${id}/dns-instructions`);
      if (response.ok) {
        const data = await response.json();
        setDnsInstructions(data);
        setSelectedDomain(domains.find((d) => d.id === id) || null);
      }
    } catch (err) {
      console.error("Failed to fetch DNS instructions:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#dcfce7";
      case "pending":
        return "#fef3c7";
      case "failed":
        return "#fee2e2";
      default:
        return "#f3f4f6";
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case "verified":
        return "#166534";
      case "pending":
        return "#92400e";
      case "failed":
        return "#991b1b";
      default:
        return "#374151";
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '32px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: '#111827' }}>
          Custom Domain Management
        </h1>

        {/* Create Domain Form */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            Register New Domain
          </h2>
          <form onSubmit={createDomain} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                Hostname
              </label>
              <input
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                placeholder="example.com"
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827'
                }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#374151' }}>
                Verification Method
              </label>
              <select
                value={verificationMethod}
                onChange={(e) => setVerificationMethod(e.target.value as "txt" | "file")}
                style={{
                  width: '100%',
                  padding: '8px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#111827'
                }}
              >
                <option value="txt">TXT Record</option>
                <option value="file">File Verification</option>
              </select>
            </div>
            {error && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '8px' }}>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                border: 'none'
              }}
            >
              {loading ? "Creating..." : "Register Domain"}
            </button>
          </form>
        </div>

        {/* Domain List */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
            Your Domains
          </h2>
          {domains.length === 0 ? (
            <p style={{ color: '#6b7280' }}>No domains registered yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', backgroundColor: '#f9fafb' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{domain.hostname}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <span
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(domain.status),
                            color: getStatusTextColor(domain.status)
                          }}
                        >
                          {domain.status}
                        </span>
                        <span style={{ fontSize: '14px', color: '#6b7280' }}>
                          {domain.verification_method?.toUpperCase()}
                        </span>
                      </div>
                      {domain.last_error && (
                        <p style={{ fontSize: '14px', color: '#dc2626', marginTop: '8px' }}>{domain.last_error}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => fetchDnsInstructions(domain.id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e5e7eb',
                          color: '#374151',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          border: 'none'
                        }}
                      >
                        DNS Instructions
                      </button>
                      {domain.status === "pending" && (
                        <button
                          onClick={() => verifyDomain(domain.id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            border: 'none'
                          }}
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* DNS Instructions Panel */}
        {dnsInstructions && selectedDomain && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '24px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#1f2937' }}>
              DNS Instructions for {dnsInstructions.hostname}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Server IP Section */}
              <div style={{ backgroundColor: '#dbeafe', border: '1px solid #93c5fd', borderRadius: '8px', padding: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1e40af' }}>
                  Server IP Address
                </h3>
                <p style={{ fontSize: '14px', color: '#1e3a8a', marginBottom: '8px' }}>
                  Point your domain's A record to this IP address:
                </p>
                <code style={{ backgroundColor: 'white', padding: '12px', borderRadius: '6px', display: 'block', fontSize: '16px', color: '#1e40af', fontWeight: '600' }}>
                  {dnsInstructions.server_ip || 'Loading...'}
                </code>
              </div>

              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>Verification Token:</p>
                <code style={{ backgroundColor: '#f3f4f6', padding: '12px', borderRadius: '6px', display: 'block', fontSize: '14px', color: '#111827' }}>
                  {dnsInstructions.verification_token}
                </code>
              </div>

              {dnsInstructions.instructions.txt_record && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>TXT Record Setup:</h3>
                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Name:</span>
                      <code style={{ marginLeft: '8px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', color: '#111827' }}>
                        {dnsInstructions.instructions.txt_record.name}
                      </code>
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Type:</span>
                      <code style={{ marginLeft: '8px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', color: '#111827' }}>
                        {dnsInstructions.instructions.txt_record.type}
                      </code>
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Value:</span>
                      <code style={{ marginLeft: '8px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', color: '#111827' }}>
                        {dnsInstructions.instructions.txt_record.value}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              {dnsInstructions.instructions.file_verification && (
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>File Verification Setup:</h3>
                  <div style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>URL:</span>
                      <code style={{ marginLeft: '8px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', color: '#111827', display: 'block', marginTop: '4px' }}>
                        {dnsInstructions.instructions.file_verification.url}
                      </code>
                    </div>
                    <div>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>Content:</span>
                      <code style={{ marginLeft: '8px', backgroundColor: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '14px', color: '#111827', display: 'block', marginTop: '4px' }}>
                        {dnsInstructions.instructions.file_verification.content}
                      </code>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setDnsInstructions(null);
                  setSelectedDomain(null);
                }}
                style={{
                  width: '100%',
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                Close Instructions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}