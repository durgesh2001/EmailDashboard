import React, { useEffect, useMemo, useState } from 'react'
import { getEmails, getAnalytics, saveReply, updateStatus, seedDemo } from './api'
import { Doughnut } from 'react-chartjs-2'
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js'
Chart.register(ArcElement, Tooltip, Legend)

export default function App() {
  const [emails, setEmails] = useState([])
  const [analytics, setAnalytics] = useState({ total24h:0, pending:0, resolved:0 })
  const [filter, setFilter] = useState('all') // all | urgent | pending | resolved
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
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>📬 Support AI Dashboard</h3>
        <div>
          <button className="btn btn-outline-secondary btn-sm me-2" onClick={load}>Refresh</button>
          <button className="btn btn-outline-primary btn-sm" onClick={onSeed}>Seed Demo</button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Stats */}
      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="card cardx p-3">
          <div className="small text-muted">Last 24h</div>
          <div className="display-6">{analytics.total24h ?? 0}</div>
        </div></div>
        <div className="col-md-3"><div className="card cardx p-3">
          <div className="small text-muted">Resolved</div>
          <div className="display-6">{analytics.resolved ?? 0}</div>
        </div></div>
        <div className="col-md-3"><div className="card cardx p-3">
          <div className="small text-muted">Pending</div>
          <div className="display-6">{analytics.pending ?? 0}</div>
        </div></div>
        <div className="col-md-3"><div className="card cardx p-3">
          <div className="small text-muted">Sentiment Mix</div>
          <Doughnut
            data={{
              labels: Object.keys(sentimentCounts),
              datasets: [{ data: Object.values(sentimentCounts) }]
            }}
            options={{
              plugins: { legend: { position: 'bottom' } }
            }}
          />

        </div></div>
      </div>

      {/* Filters */}
      <div className="d-flex gap-2 mb-3">
        <span className="small text-muted me-2">Filter:</span>
        <button className={`btn btn-sm ${filter==='all'?'btn-primary':'btn-outline-primary'}`} onClick={()=>setFilter('all')}>All</button>
        <button className={`btn btn-sm ${filter==='urgent'?'btn-danger':'btn-outline-danger'}`} onClick={()=>setFilter('urgent')}>Urgent</button>
        <button className={`btn btn-sm ${filter==='pending'?'btn-warning':'btn-outline-warning'}`} onClick={()=>setFilter('pending')}>Pending</button>
        <button className={`btn btn-sm ${filter==='resolved'?'btn-success':'btn-outline-success'}`} onClick={()=>setFilter('resolved')}>Resolved</button>
      </div>

      {loading && <div className="alert alert-info">Loading…</div>}
      {!loading && filtered.length === 0 && <div className="alert alert-secondary">No emails to show.</div>}

      <div className="row g-3">
        {filtered.map(e => (
          <div key={e.id} className="col-12">
            <div className="card cardx p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${e.priority==='Urgent' ? 'badge-urgent' : 'bg-secondary'}`}>{e.priority || 'Not urgent'}</span>
                  <span className="badge bg-info">{e.sentiment || 'Neutral'}</span>
                  <span className={`badge ${e.status==='Resolved'?'bg-success':'bg-dark'}`}>{e.status}</span>
                </div>
                <div className="text-end">
                  <div className="fw-bold">{e.subject}</div>
                  <div className="small text-muted">{e.sender}</div>
                </div>
              </div>
              <hr/>
              <pre>{e.body}</pre>

              <div className="row g-3 mt-2">
                <div className="col-md-4">
                  <div className="small text-muted">Extracted</div>
                  <div className="mt-1">
                    <div><strong>Phone:</strong> {e.phone || '-'}</div>
                    <div><strong>Alt Email:</strong> {e.altEmail || '-'}</div>
                    <div className="mt-2"><strong>Requirements:</strong><br/>{e.requirements || '-'}</div>
                  </div>
                </div>

                <div className="col-md-8">
                  <label className="form-label">AI Draft Reply</label>
                  <textarea id={`reply-${e.id}`} defaultValue={e.draftReply || ''}></textarea>
                  <div className="d-flex gap-2 mt-2">
                    <button className="btn btn-primary btn-sm" onClick={()=>onSaveReply(e.id)}>Save & Approve</button>
                    {e.status !== 'Resolved' && <button className="btn btn-outline-success btn-sm" onClick={()=>onResolve(e.id)}>Mark Resolved</button>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
