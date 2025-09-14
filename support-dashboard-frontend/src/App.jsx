import React, { useEffect, useMemo, useState } from 'react'
import { getEmails, getAnalytics, saveReply, updateStatus, seedDemo } from './api'
import DOMPurify from 'dompurify';
import { Doughnut } from 'react-chartjs-2'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
Chart.register(ArcElement, Tooltip, Legend)

export default function App() {
  const [emails, setEmails] = useState([])
  const [analytics, setAnalytics] = useState({ total24h:0, pending:0, resolved:0 })
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const [e, a] = await Promise.all([getEmails(), getAnalytics()])
      setEmails(e); setAnalytics(a)
    } catch (err) {
      setError(err.message)
      console.error(err)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ load() }, [])

  const filtered = useMemo(() => {
    return emails.filter(e => {
      if (filter === 'urgent') return e.priority === 'Urgent'
      if (filter === 'pending') return e.status === 'Pending'
      if (filter === 'resolved') return e.status === 'Resolved'
      return true
    })
  }, [emails, filter])

  const sentimentCounts = useMemo(()=>{
    const c = { Positive:0, Negative:0, Neutral:0 }
    for (const e of emails) c[e.sentiment || 'Neutral'] = (c[e.sentiment || 'Neutral']||0)+1
    return c
  }, [emails])

  const onSaveReply = async (id) => {
    const ta = document.getElementById(`reply-${id}`)
    const text = ta.value
    try {
      await saveReply(id, text)
      await load()
      alert('Saved & approved')
    } catch (err) {
      alert('Error saving reply: ' + err.message)
    }
  }

  const onResolve = async (id) => {
    try {
      await updateStatus(id, 'Resolved')
      await load()
    } catch (err) {
      alert('Error updating status: ' + err.message)
    }
  }

  const onSeed = async () => {
    try { await seedDemo(); await load(); }
    catch (err) { alert('Seed failed: ' + err.message) }
  }

  return (
    <div>
      {/* Navbar */}
      <nav className="navbar fixed-top shadow-sm px-4 py-2"
        style={{ background: "linear-gradient(90deg,#eb2592,#1e40af)", color: "#fff" }}>
        <h4 className="mb-0">📬 Support AI Dashboard</h4>
        <div>
          <button className="btn btn-light btn-sm me-2" onClick={load}>Refresh</button>
          <button className="btn btn-warning btn-sm" onClick={onSeed}>Seed Demo</button>
        </div>
      </nav>

      {/* Content container with top spacing because navbar is fixed */}
      <div className="container py-5 mt-5">

        {error && <div className="alert alert-danger">{error}</div>}

        {/* Stats Section */}
        <div className="row g-3 mb-4">
          <div className="col-md-3">
            <div className="card dashboard-card p-3 total">
              <div className="small text-muted">Last 24h</div>
              <div className="display-6">{analytics.total24h ?? 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card dashboard-card p-3 resolved">
              <div className="small text-muted">Resolved</div>
              <div className="display-6 text-success">{analytics.resolved ?? 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card dashboard-card p-3 pending">
              <div className="small text-muted">Pending</div>
              <div className="display-6 text-warning">{analytics.pending ?? 0}</div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card dashboard-card p-3 text-center">
              <div className="small text-muted mb-2">Sentiment Mix</div>
              <Doughnut
                data={{
                  labels: Object.keys(sentimentCounts),
                  datasets: [{
                    data: Object.values(sentimentCounts),
                    backgroundColor: ["#22c55e", "#ef4444", "#3b82f6"]
                  }]
                }}
                options={{
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="d-flex gap-2 mb-4 flex-wrap">
          <span className="small text-muted me-2">Filter:</span>
          <button className={`btn filter-btn ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All</button>
          <button className={`btn filter-btn ${filter==='urgent'?'active urgent':''}`} onClick={()=>setFilter('urgent')}>Urgent</button>
          <button className={`btn filter-btn ${filter==='pending'?'active pending':''}`} onClick={()=>setFilter('pending')}>Pending</button>
          <button className={`btn filter-btn ${filter==='resolved'?'active resolved':''}`} onClick={()=>setFilter('resolved')}>Resolved</button>
        </div>

        {loading && <div className="alert alert-info">Loading…</div>}
        {!loading && filtered.length === 0 && <div className="alert alert-secondary">No emails to show.</div>}

        <div className="row g-3">
          {filtered.map(e => (
            <div key={e.id} className="col-12">
              <div className="card email-card p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${e.priority==='Urgent' ? 'bg-danger' : 'bg-secondary'}`}>{e.priority || 'Not urgent'}</span>
                    <span className="badge bg-info">{e.sentiment || 'Neutral'}</span>
                    <span className={`badge ${e.status==='Resolved'?'bg-success':'bg-dark'}`}>{e.status}</span>
                  </div>
                  <div className="text-end">
                    <div className="fw-bold">{e.subject}</div>
                    <div className="small text-muted">{e.sender}</div>
                  </div>
                </div>
                <hr/>

                {/* NEW layout */}
                <div className="row g-3 mt-2">
                  {/* Left side: Mail Body + Extracted */}
                  <div className="col-md-7">
                    <pre className="email-body" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(e.body) }} />

                    <div className="mt-3">
                      <div className="small text-muted">Extracted</div>
                      <div className="mt-1">
                        <div><strong>Phone:</strong> {e.phone || '-'}</div>
                        <div><strong>Alt Email:</strong> {e.altEmail || '-'}</div>
                        <div className="mt-2"><strong>Requirements:</strong><br />{e.requirements || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Right side: AI Draft Reply */}
                  <div className="col-md-5">
                    <label className="form-label fw-bold">AI Draft Reply</label>
                    <textarea
                      id={`reply-${e.id}`}
                      className="form-control styled-textarea large-textarea"
                      defaultValue={e.draftReply}
                      style={{ minHeight: "350px" }}
                    ></textarea>
                    <div className="d-flex gap-2 mt-3">
                      <button className="btn btn-primary btn-sm" onClick={()=>onSaveReply(e.id)}>Save & Approve</button>
                      {e.status !== 'Resolved' && (
                        <button className="btn btn-outline-success btn-sm" onClick={()=>onResolve(e.id)}>Mark Resolved</button>
                      )}
                    </div>
                  </div>
                </div>
                {/* END layout */}

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom styles inline or move to CSS */}
      <style>{`
        .dashboard-card {
          border-radius: 1rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.08);
          transition: transform 0.2s;
        }
        .dashboard-card:hover {
          transform: translateY(-3px);
        }
        .total{
            background: #EBE4E8;
        }
        .pending{
            background: #F9F994;
        }
        .resolved{
             background: #34eb9b;
         }
        .email-card {
          border-radius: 1rem;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .email-card:hover {
          transform: translateY(-4px);
        }
        .email-body {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 0.5rem;
          white-space: pre-wrap;
        }
        .styled-textarea {
          border-radius: 0.5rem;
          padding: 0.5rem;
        }
    .large-textarea {
      min-height: 420px;   /* taller for comfort */
      border-radius: 0.6rem;
      padding: 1rem;
      font-size: 1rem;
      line-height: 1.5;
      resize: vertical;   /* allow user resizing if needed */
      background: #fafafa;
      border: 1px solid #ddd;
    }

    .reply-box {
      background: #ffffff;
      border-radius: 0.8rem;
      padding: 1rem 1.25rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); /* subtle shadow */
      transition: box-shadow 0.3s ease;
    }

    .reply-box:hover {
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.12);
    }

        .filter-btn {
          border-radius: 20px;
          padding: 0.3rem 1rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
        }
        .filter-btn.active {
          background: #2563eb;
          color: #fff;
        }
        .filter-btn.urgent.active { background: #dc2626; }
        .filter-btn.pending.active { background: #f59e0b; }
        .filter-btn.resolved.active { background: #16a34a; }
      `}</style>
    </div>
  )
}
