import{useState,useEffect}from'react'
import{ShieldAlert,RefreshCw,Activity,AlertTriangle,TrendingUp,Users}from'lucide-react'
import{PieChart,Pie,Cell,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from'recharts'
import{useAuthStore}from'@/store/authStore'
import api from'@/utils/api'

const RC={LOW:'#555555',MEDIUM:'#f59e0b',HIGH:'#f97316',CRITICAL:'#ff3b3b'}
const TT=({active,payload})=>{if(!active||!payload?.length)return null;return<div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}><p style={{color:'var(--text-2)',margin:0}}>{payload[0].payload.name}: <strong>{payload[0].value}</strong></p></div>}

export default function AdminPage(){
  const user=useAuthStore(s=>s.user)
  const[stats,setStats]=useState(null)
  const[loading,setLoading]=useState(true)
  const[error,setError]=useState(null)
  const fetchStats=async()=>{
    setLoading(true);setError(null)
    try{const{data}=await api.get('/admin/stats');setStats(data)}
    catch(e){setError(e.response?.data?.detail||'Admin access required')}
    finally{setLoading(false)}
  }
  useEffect(()=>{fetchStats()},[])

  if(!user?.is_admin)return<div style={{padding:32,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:400,textAlign:'center'}}>
    <ShieldAlert size={32} color="var(--text-3)" style={{marginBottom:16}}/>
    <div className="page-title" style={{fontSize:18}}>Admin Access Required</div>
    <p style={{fontSize:13,color:'var(--text-3)',marginTop:8,maxWidth:340}}>Your account does not have admin privileges.</p>
    <div style={{marginTop:16,padding:'8px 16px',background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>{user?.username} · {user?.email}</div>
  </div>

  const pieData=stats?Object.entries(stats.risk_breakdown).map(([name,value])=>({name,value})):[]
  const cards=stats?[
    {label:'Total Predictions',value:stats.total_predictions.toLocaleString(),icon:Activity},
    {label:'Total Anomalies',value:stats.total_anomalies.toLocaleString(),icon:AlertTriangle,danger:true},
    {label:'Anomaly Rate',value:`${(stats.anomaly_rate*100).toFixed(2)}%`,icon:TrendingUp},
    {label:'Registered Users',value:stats.total_users,icon:Users},
  ]:[]

  return<div style={{padding:32,display:'flex',flexDirection:'column',gap:24}} className="fade-in">
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div><div className="page-title">Admin</div><div className="page-sub">System-wide statistics</div></div>
      <button onClick={fetchStats} className="btn-ghost" style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}><RefreshCw size={13} style={{animation:loading?'spin 1s linear infinite':'none'}}/>Refresh</button>
    </div>
    {error&&<div style={{background:'#1a0a0a',border:'1px solid #2a1515',borderRadius:8,padding:16,fontSize:13,color:'var(--danger)',fontFamily:'DM Mono,monospace'}}>{error}</div>}
    {loading?<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:80}}><RefreshCw size={18} color="var(--text-3)" style={{animation:'spin 1s linear infinite'}}/></div>:stats&&<>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16}}>
        {cards.map(({label,value,icon:Icon,danger})=><div key={label} className="card-hover">
          <Icon size={16} color={danger?'var(--danger)':'var(--text-3)'} style={{marginBottom:16}}/>
          <div className="stat-number" style={{color:danger?'var(--danger)':'var(--text)'}}>{value}</div>
          <div className="stat-label">{label}</div>
        </div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
        <div className="card">
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4}}>Risk Distribution</div>
          <div className="section-tag" style={{marginBottom:16}}>By severity level</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" paddingAngle={3}>
              {pieData.map((e,i)=><Cell key={i} fill={RC[e.name]||'var(--text-3)'} stroke="none"/>)}
            </Pie><Tooltip content={<TT/>}/></PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex',justifyContent:'center',flexWrap:'wrap',gap:14,marginTop:8}}>
            {pieData.map(d=><div key={d.name} style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:7,height:7,borderRadius:2,background:RC[d.name]}}/><span style={{fontSize:11,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>{d.name}: {d.value}</span></div>)}
          </div>
        </div>
        <div className="card">
          <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4}}>Risk Counts</div>
          <div className="section-tag" style={{marginBottom:16}}>Absolute numbers</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pieData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="name" stroke="var(--border-2)" tick={{fontSize:11,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
              <YAxis stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
              <Tooltip content={<TT/>}/>
              <Bar dataKey="value" radius={[4,4,0,0]}>{pieData.map((e,i)=><Cell key={i} fill={RC[e.name]||'var(--text-3)'}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:20}}>System Information</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[['Model','Isolation Forest'],['Estimators','200 trees'],['Contamination','2%'],['Avg Risk Score',`${(stats.avg_anomaly_score*100).toFixed(1)}%`],['API','FastAPI v1.0.0'],['Database','SQLite / PostgreSQL']].map(([k,v])=>(
            <div key={k} style={{padding:'14px 16px',background:'var(--bg-3)',borderRadius:6,border:'1px solid var(--border)'}}>
              <div style={{fontSize:10,color:'var(--text-3)',fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{k}</div>
              <div style={{fontSize:13,fontWeight:500,color:'var(--text-2)',fontFamily:'DM Mono,monospace'}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </>}
  </div>
}
