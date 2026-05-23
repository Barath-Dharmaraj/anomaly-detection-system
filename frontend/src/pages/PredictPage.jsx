import{useState}from'react'
import{Zap,Loader2,Download,RotateCcw}from'lucide-react'
import{BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Cell}from'recharts'
import toast from'react-hot-toast'
import api from'@/utils/api'
import{downloadPredictionReport}from'@/utils/pdfReport'

const CATS=['Grocery','Retail','Dining','Electronics','Other']
const DAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
const DEFAULT={amount:'',hour:12,day_of_week:0,merchant_cat:0,distance_km:'',trans_per_day:3,balance_ratio:0.7,is_international:false,velocity_1h:1}
const FRAUD={amount:2450.99,hour:2,day_of_week:6,merchant_cat:4,distance_km:120.5,trans_per_day:15,balance_ratio:0.05,is_international:true,velocity_1h:8}
const NORMAL={amount:45.20,hour:14,day_of_week:2,merchant_cat:0,distance_km:2.3,trans_per_day:2,balance_ratio:0.75,is_international:false,velocity_1h:0}

const TT=({active,payload})=>{
  if(!active||!payload?.length)return null
  return<div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>
    <p style={{color:'var(--text-2)',margin:0}}>{payload[0].payload.name}: <strong>{payload[0].value.toFixed(2)}%</strong></p>
  </div>
}

function ScoreBox({score,isAnomaly}){
  const pct=Math.round(score*100)
  const color=isAnomaly?'var(--danger)':'var(--success)'
  return<div style={{textAlign:'center',padding:'32px 24px',background:'var(--bg-3)',borderRadius:8,border:`1px solid ${isAnomaly?'#2a1515':'#152015'}`}}>
    <div style={{fontFamily:'Syne,sans-serif',fontSize:56,fontWeight:700,color,lineHeight:1,letterSpacing:'-0.04em'}}>{pct}<span style={{fontSize:28}}>%</span></div>
    <div style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)',marginTop:6,textTransform:'uppercase',letterSpacing:'0.1em'}}>Risk Score</div>
    <div style={{marginTop:20,display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:5,background:isAnomaly?'#1a0a0a':'#0a1a0f',border:`1px solid ${isAnomaly?'#3a1515':'#1a3020'}`}}>
      <div style={{width:6,height:6,borderRadius:'50%',background:color}}/>
      <span style={{fontFamily:'DM Mono,monospace',fontSize:12,fontWeight:700,color}}>{isAnomaly?'ANOMALY':'NORMAL'}</span>
    </div>
  </div>
}

export default function PredictPage(){
  const[form,setForm]=useState(DEFAULT)
  const[result,setResult]=useState(null)
  const[loading,setLoading]=useState(false)
  const set=(k,v)=>setForm(f=>({...f,[k]:v}))

  const handleSubmit=async(e)=>{
    e.preventDefault();setLoading(true)
    try{
      const payload={...form,amount:parseFloat(form.amount),distance_km:parseFloat(form.distance_km),
        trans_per_day:parseFloat(form.trans_per_day),balance_ratio:parseFloat(form.balance_ratio),velocity_1h:parseFloat(form.velocity_1h)}
      const{data}=await api.post('/predict/',payload)
      setResult({prediction:data,input:payload})
      data.is_anomaly?toast.error('Anomaly detected'):toast.success('Normal transaction')
    }catch(err){toast.error(err.response?.data?.detail||'Prediction failed')}
    finally{setLoading(false)}
  }

  const importanceData=result
    ?Object.entries(result.prediction.feature_importance||{}).sort(([,a],[,b])=>b-a).slice(0,8)
      .map(([name,value])=>({name:name.replace(/_/g,' '),value:parseFloat((value*100).toFixed(2))}))
    :[]

  return<div style={{padding:32,display:'flex',flexDirection:'column',gap:24}} className="fade-in">
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div><div className="page-title">Run Prediction</div><div className="page-sub">Analyse a single transaction</div></div>
      <div style={{display:'flex',gap:8}}>
        <button onClick={()=>{setForm(NORMAL);setResult(null)}} className="btn-ghost" style={{fontSize:12}}>Load Normal</button>
        <button onClick={()=>{setForm(FRAUD);setResult(null)}} className="btn-danger" style={{fontSize:12}}>Load Fraud</button>
      </div>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
      <div className="card">
        <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:20,display:'flex',alignItems:'center',gap:8}}><Zap size={14} color="var(--text-3)"/>Transaction Details</div>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="label">Amount (USD)</label><input type="number" step="0.01" min="0" required className="input-field" placeholder="0.00" value={form.amount} onChange={e=>set('amount',e.target.value)}/></div>
            <div><label className="label">Hour (0–23)</label><input type="number" min="0" max="23" className="input-field" value={form.hour} onChange={e=>set('hour',parseInt(e.target.value))}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="label">Day of Week</label><select className="input-field" value={form.day_of_week} onChange={e=>set('day_of_week',parseInt(e.target.value))}>{DAYS.map((d,i)=><option key={i} value={i}>{d}</option>)}</select></div>
            <div><label className="label">Merchant Category</label><select className="input-field" value={form.merchant_cat} onChange={e=>set('merchant_cat',parseInt(e.target.value))}>{CATS.map((c,i)=><option key={i} value={i}>{c}</option>)}</select></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="label">Distance (km)</label><input type="number" step="0.1" min="0" className="input-field" placeholder="0.0" value={form.distance_km} onChange={e=>set('distance_km',e.target.value)}/></div>
            <div><label className="label">Transactions Today</label><input type="number" min="0" className="input-field" value={form.trans_per_day} onChange={e=>set('trans_per_day',e.target.value)}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div><label className="label">Balance Ratio (0–1)</label><input type="number" step="0.01" min="0" max="1" className="input-field" value={form.balance_ratio} onChange={e=>set('balance_ratio',e.target.value)}/></div>
            <div><label className="label">Velocity (last 1h)</label><input type="number" min="0" className="input-field" value={form.velocity_1h} onChange={e=>set('velocity_1h',e.target.value)}/></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-3)',borderRadius:6,border:'1px solid var(--border)',cursor:'pointer'}} onClick={()=>set('is_international',!form.is_international)}>
            <div style={{width:16,height:16,borderRadius:4,border:'1px solid var(--border-2)',background:form.is_international?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              {form.is_international&&<div style={{width:8,height:8,borderRadius:2,background:'#000'}}/>}
            </div>
            <span style={{fontSize:13,color:'var(--text-2)'}}>International transaction</span>
          </div>
          <div style={{display:'flex',gap:10,paddingTop:4}}>
            <button type="submit" disabled={loading} className="btn-primary" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
              {loading?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Analysing…</>:<><Zap size={13}/>Analyse</>}
            </button>
            <button type="button" onClick={()=>{setForm(DEFAULT);setResult(null)}} className="btn-ghost" style={{padding:'10px 14px'}}><RotateCcw size={13}/></button>
          </div>
        </form>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {result?(
          <>
            <ScoreBox score={result.prediction.anomaly_score} isAnomaly={result.prediction.is_anomaly}/>
            <div className="card" style={{padding:20}}>
              {[['Risk Level',<span className={`badge-risk-${result.prediction.risk_level}`}>{result.prediction.risk_level}</span>],
                ['Confidence',<span style={{fontFamily:'DM Mono,monospace',fontSize:12}}>{(result.prediction.confidence*100).toFixed(1)}%</span>],
                ['Label',<span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--text-3)'}}>{result.prediction.label===1?'1 — Anomaly':'0 — Normal'}</span>],
                ['Prediction ID',<span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--text-3)'}}>#{result.prediction.id}</span>],
              ].map(([k,v])=>(
                <div key={k} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid var(--border)'}}>
                  <span style={{fontSize:12,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>{k}</span>{v}
                </div>
              ))}
              <button onClick={()=>downloadPredictionReport(result.prediction,result.input)} style={{display:'flex',alignItems:'center',gap:6,marginTop:14,background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:12,fontFamily:'DM Mono,monospace'}}>
                <Download size={12}/>Export PDF report
              </button>
            </div>
            {importanceData.length>0&&<div className="card" style={{padding:20}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text)',marginBottom:4}}>Feature Importance</div>
              <div className="section-tag" style={{marginBottom:16}}>What drove this result</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={importanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                  <XAxis type="number" stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}} unit="%"/>
                  <YAxis dataKey="name" type="category" stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}} width={85}/>
                  <Tooltip content={<TT/>}/>
                  <Bar dataKey="value" radius={[0,3,3,0]}>{importanceData.map((_,i)=><Cell key={i} fill={i===0?'var(--danger)':i<3?'#f97316':'var(--text-3)'}/>)}</Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>}
          </>
        ):(
          <div className="card" style={{minHeight:280,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}>
            <Zap size={28} color="var(--text-3)" style={{marginBottom:12}}/>
            <p style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>No prediction yet</p>
            <p style={{fontSize:12,color:'var(--text-3)',marginTop:4,opacity:.6}}>Fill the form and click Analyse</p>
          </div>
        )}
      </div>
    </div>
  </div>
}
