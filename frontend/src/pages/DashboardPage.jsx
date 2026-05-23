import{useState,useEffect}from'react'
import{useOutletContext}from'react-router-dom'
import{AreaChart,Area,BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from'recharts'
import{Activity,AlertTriangle,ShieldCheck,Users,TrendingUp}from'lucide-react'
import{format}from'date-fns'
import api from'@/utils/api'

const C={normal:'#22c55e',anomaly:'#ff3b3b',medium:'#f59e0b',high:'#f97316',low:'#555555'}
const TT=({active,payload,label})=>{
  if(!active||!payload?.length)return null
  return<div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'10px 14px',fontSize:12,fontFamily:'DM Mono,monospace'}}>
    {label&&<p style={{color:'var(--text-3)',marginBottom:4}}>{label}</p>}
    {payload.map((p,i)=><p key={i} style={{color:p.color||'var(--text)',margin:'2px 0'}}>{p.name}: <strong>{p.value}</strong></p>)}
  </div>
}
function StatCard({icon:Icon,label,value,sub,danger}){
  return<div className="card-hover">
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
      <Icon size={16} color={danger?'var(--danger)':'var(--text-3)'}/>
      <TrendingUp size={12} color="var(--text-3)"/>
    </div>
    <div className="stat-number" style={{color:danger?'var(--danger)':'var(--text)'}}>{value}</div>
    <div className="stat-label">{label}</div>
    {sub&&<div style={{fontSize:11,color:'var(--text-3)',marginTop:4,fontFamily:'DM Mono,monospace'}}>{sub}</div>}
  </div>
}
export default function DashboardPage(){
  const{liveEvents,connected}=useOutletContext()
  const[stats,setStats]=useState(null)
  const[history,setHistory]=useState([])
  const[loading,setLoading]=useState(true)
  useEffect(()=>{
    Promise.all([api.get('/admin/stats').catch(()=>({data:null})),api.get('/history?page_size=100')])
      .then(([s,h])=>{setStats(s.data);setHistory(h.data.items||[])})
      .finally(()=>setLoading(false))
  },[])
  const timeData=(()=>{const m={};history.forEach(h=>{const k=format(new Date(h.created_at),'MM/dd HH:mm');if(!m[k])m[k]={time:k,normal:0,anomaly:0};h.is_anomaly?m[k].anomaly++:m[k].normal++});return Object.values(m).slice(-20)})()
  const riskData=stats?Object.entries(stats.risk_breakdown||{}).map(([name,value])=>({name,value})):[]
  const pieData=stats?[{name:'Normal',value:stats.total_predictions-stats.total_anomalies},{name:'Anomaly',value:stats.total_anomalies}]:[]
  if(loading)return<div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%'}}><span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--text-3)'}}>Loading…</span></div>
  return<div style={{padding:32,display:'flex',flexDirection:'column',gap:24}} className="fade-in">
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div><div className="page-title">Dashboard</div><div className="page-sub">Real-time anomaly monitoring</div></div>
      <div style={{display:'flex',alignItems:'center',gap:6,fontFamily:'DM Mono,monospace',fontSize:11,color:connected?'var(--success)':'var(--text-3)'}}>
        <div style={{width:6,height:6,borderRadius:'50%',background:connected?'var(--success)':'var(--text-3)'}}/>
        {connected?'Live':'Offline'}
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
      <StatCard icon={Activity}      label="Total Scans"    value={stats?.total_predictions?.toLocaleString()??history.length}/>
      <StatCard icon={AlertTriangle} label="Anomalies"      value={stats?.total_anomalies??0} danger sub={`${((stats?.anomaly_rate||0)*100).toFixed(1)}% rate`}/>
      <StatCard icon={ShieldCheck}   label="Avg Risk Score" value={`${((stats?.avg_anomaly_score||0)*100).toFixed(0)}%`}/>
      <StatCard icon={Users}         label="Analysts"       value={stats?.total_users??1}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:16}}>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4}}>Detection Timeline</div>
        <div className="section-tag" style={{marginBottom:16}}>Normal vs Anomaly over time</div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={timeData}>
            <defs>
              <linearGradient id="gN" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.normal} stopOpacity={0.12}/><stop offset="95%" stopColor={C.normal} stopOpacity={0}/></linearGradient>
              <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.anomaly} stopOpacity={0.15}/><stop offset="95%" stopColor={C.anomaly} stopOpacity={0}/></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
            <XAxis dataKey="time" stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
            <YAxis stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
            <Tooltip content={<TT/>}/>
            <Area type="monotone" dataKey="normal"  stroke={C.normal}  fill="url(#gN)" strokeWidth={1.5} name="Normal"/>
            <Area type="monotone" dataKey="anomaly" stroke={C.anomaly} fill="url(#gA)" strokeWidth={1.5} name="Anomaly"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4}}>Classification</div>
        <div className="section-tag" style={{marginBottom:16}}>Split overview</div>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} paddingAngle={3} dataKey="value">
            <Cell fill={C.normal} stroke="none"/><Cell fill={C.anomaly} stroke="none"/>
          </Pie><Tooltip content={<TT/>}/></PieChart>
        </ResponsiveContainer>
        <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:8}}>
          {pieData.map((d,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:8,height:8,borderRadius:2,background:i===0?C.normal:C.anomaly}}/><span style={{fontSize:11,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>{d.name}</span></div>)}
        </div>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4}}>Risk Breakdown</div>
        <div className="section-tag" style={{marginBottom:16}}>By severity level</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={riskData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
            <XAxis type="number" stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
            <YAxis dataKey="name" type="category" stroke="var(--border-2)" tick={{fontSize:11,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}} width={60}/>
            <Tooltip content={<TT/>}/>
            <Bar dataKey="value" radius={[0,4,4,0]}>
              {riskData.map((r,i)=><Cell key={i} fill={r.name==='CRITICAL'?C.anomaly:r.name==='HIGH'?C.high:r.name==='MEDIUM'?C.medium:C.low}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
          <div><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>Live Feed</div><div className="section-tag" style={{marginTop:2}}>Real-time events</div></div>
          <span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>{liveEvents.length}</span>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:160,overflowY:'auto'}}>
          {liveEvents.length===0?<p style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)',textAlign:'center',padding:'20px 0'}}>Awaiting events…</p>
          :liveEvents.map(e=><div key={e.id} style={{display:'flex',alignItems:'center',gap:8,padding:'7px 10px',borderRadius:5,background:'var(--bg-3)',border:`1px solid ${e.is_anomaly?'#2a1515':'#152015'}`,fontFamily:'DM Mono,monospace',fontSize:11}} className="fade-in">
            <div style={{width:5,height:5,borderRadius:'50%',background:e.is_anomaly?'var(--danger)':'var(--success)',flexShrink:0}}/>
            <span style={{color:'var(--text-2)',fontWeight:500}}>{e.user}</span>
            <span style={{color:'var(--text-3)'}}>{e.risk_level}</span>
            <span style={{marginLeft:'auto',color:'var(--text-3)'}}>{(e.score*100).toFixed(0)}%</span>
          </div>)}
        </div>
      </div>
    </div>
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)'}}>
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>Recent Predictions</div>
        <div className="section-tag" style={{marginTop:2}}>Latest 10 scans</div>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse'}}>
        <thead><tr>{['ID','Amount','Risk Score','Level','Status','Time'].map(h=><th key={h} className="tbl-head" style={{textAlign:'left'}}>{h}</th>)}</tr></thead>
        <tbody>
          {history.slice(0,10).map(row=><tr key={row.id} className="tbl-row">
            <td style={{padding:'11px 16px',fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--text-3)'}}>#{row.id}</td>
            <td style={{padding:'11px 16px',fontFamily:'DM Mono,monospace',fontSize:12}}>${row.amount?.toFixed(2)??'—'}</td>
            <td style={{padding:'11px 16px'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:60,height:2,background:'var(--bg-4)',borderRadius:1}}><div style={{width:`${row.anomaly_score*100}%`,height:'100%',borderRadius:1,background:row.is_anomaly?'var(--danger)':'var(--success)'}}/></div><span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>{(row.anomaly_score*100).toFixed(0)}%</span></div></td>
            <td style={{padding:'11px 16px'}}><span className={`badge-risk-${row.risk_level}`}>{row.risk_level}</span></td>
            <td style={{padding:'11px 16px'}}>{row.is_anomaly?<span className="badge-anomaly">ANOMALY</span>:<span className="badge-normal">NORMAL</span>}</td>
            <td style={{padding:'11px 16px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>{format(new Date(row.created_at),'MMM dd, HH:mm')}</td>
          </tr>)}
        </tbody>
      </table>
      {history.length===0&&<p style={{textAlign:'center',padding:'32px',color:'var(--text-3)',fontFamily:'DM Mono,monospace',fontSize:12}}>No predictions yet — run one from the Predict page</p>}
    </div>
  </div>
}
