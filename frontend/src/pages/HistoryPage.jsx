import{useState,useEffect,useCallback}from'react'
import{format}from'date-fns'
import{RefreshCw,ChevronLeft,ChevronRight,Filter}from'lucide-react'
import{ScatterChart,Scatter,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Cell}from'recharts'
import api from'@/utils/api'

export default function HistoryPage(){
  const[data,setData]=useState(null)
  const[loading,setLoading]=useState(true)
  const[page,setPage]=useState(1)
  const[filters,setFilters]=useState({anomaly_only:false,source:''})

  const fetchHistory=useCallback(async()=>{
    setLoading(true)
    try{
      const params=new URLSearchParams({page,page_size:20,...(filters.anomaly_only?{anomaly_only:true}:{}),...(filters.source?{source:filters.source}:{})})
      const{data:res}=await api.get(`/history?${params}`)
      setData(res)
    }finally{setLoading(false)}
  },[page,filters])

  useEffect(()=>{fetchHistory()},[fetchHistory])

  const totalPages=data?Math.ceil(data.total/20):1
  const scatterData=(data?.items||[]).map((item,i)=>({x:i,y:item.anomaly_score*100,anomaly:item.is_anomaly,id:item.id}))

  const TT=({active,payload})=>{
    if(!active||!payload?.length)return null
    const d=payload[0].payload
    return<div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}>
      <p style={{color:'var(--text-3)',margin:0}}>ID #{d.id}</p>
      <p style={{color:d.anomaly?'var(--danger)':'var(--success)',margin:0}}>Score: {d.y.toFixed(1)}%</p>
    </div>
  }

  return<div style={{padding:32,display:'flex',flexDirection:'column',gap:24}} className="fade-in">
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:16}}>
      <div><div className="page-title">History</div><div className="page-sub">{data?.total??0} predictions · {data?.anomaly_count??0} anomalies</div></div>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',background:'var(--bg-2)',border:'1px solid var(--border)',borderRadius:6,cursor:'pointer'}} onClick={()=>{setFilters(f=>({...f,anomaly_only:!f.anomaly_only}));setPage(1)}}>
          <div style={{width:14,height:14,borderRadius:3,border:'1px solid var(--border-2)',background:filters.anomaly_only?'var(--accent)':'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
            {filters.anomaly_only&&<div style={{width:7,height:7,borderRadius:1,background:'#000'}}/>}
          </div>
          <span style={{fontSize:12,color:'var(--text-2)'}}>Anomalies only</span>
        </div>
        <select className="input-field" style={{width:120}} value={filters.source} onChange={e=>{setFilters(f=>({...f,source:e.target.value}));setPage(1)}}>
          <option value="">All sources</option><option value="manual">Manual</option><option value="batch">Batch</option>
        </select>
        <button onClick={fetchHistory} className="btn-ghost" style={{padding:'8px 12px'}}><RefreshCw size={13} style={{animation:loading?'spin 1s linear infinite':'none'}}/></button>
      </div>
    </div>
    {scatterData.length>0&&<div className="card">
      <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:4}}>Score Distribution</div>
      <div className="section-tag" style={{marginBottom:16}}>Each dot is one prediction</div>
      <ResponsiveContainer width="100%" height={130}>
        <ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
          <XAxis dataKey="x" stroke="var(--border-2)" tick={false}/>
          <YAxis dataKey="y" stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}} unit="%" domain={[0,100]}/>
          <Tooltip content={<TT/>} cursor={false}/>
          <Scatter data={scatterData}>{scatterData.map((d,i)=><Cell key={i} fill={d.anomaly?'var(--danger)':'var(--success)'} opacity={0.75}/>)}</Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      <div style={{display:'flex',gap:16,marginTop:8}}>
        {[['var(--success)','Normal'],['var(--danger)','Anomaly']].map(([color,label])=><div key={label} style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:7,height:7,borderRadius:'50%',background:color}}/><span style={{fontSize:11,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>{label}</span></div>)}
      </div>
    </div>}
    <div className="card" style={{padding:0,overflow:'hidden'}}>
      {loading?<div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:48}}><RefreshCw size={16} color="var(--text-3)" style={{animation:'spin 1s linear infinite'}}/></div>:(
        <>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['ID','Amount','Score','Level','Source','Status','Time'].map(h=><th key={h} className="tbl-head" style={{textAlign:'left'}}>{h}</th>)}</tr></thead>
            <tbody>
              {data?.items?.map(row=><tr key={row.id} className="tbl-row" style={{background:row.is_anomaly?'#0f0808':'transparent'}}>
                <td style={{padding:'11px 16px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>#{row.id}</td>
                <td style={{padding:'11px 16px',fontFamily:'DM Mono,monospace',fontSize:12}}>{row.amount!=null?`$${row.amount.toFixed(2)}`:'—'}</td>
                <td style={{padding:'11px 16px'}}><div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:50,height:2,background:'var(--bg-4)',borderRadius:1}}><div style={{width:`${row.anomaly_score*100}%`,height:'100%',borderRadius:1,background:row.is_anomaly?'var(--danger)':'var(--success)'}}/></div><span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>{(row.anomaly_score*100).toFixed(0)}%</span></div></td>
                <td style={{padding:'11px 16px'}}><span className={`badge-risk-${row.risk_level}`}>{row.risk_level}</span></td>
                <td style={{padding:'11px 16px'}}><span style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)',background:'var(--bg-3)',padding:'2px 8px',borderRadius:3}}>{row.source}</span></td>
                <td style={{padding:'11px 16px'}}>{row.is_anomaly?<span className="badge-anomaly">ANOMALY</span>:<span className="badge-normal">NORMAL</span>}</td>
                <td style={{padding:'11px 16px',fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)'}}>{format(new Date(row.created_at),'MMM dd, HH:mm')}</td>
              </tr>)}
            </tbody>
          </table>
          {data?.items?.length===0&&<div style={{textAlign:'center',padding:40}}><Filter size={20} color="var(--text-3)" style={{margin:'0 auto 10px'}}/><p style={{fontSize:12,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>No predictions found</p></div>}
          {totalPages>1&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderTop:'1px solid var(--border)'}}>
            <span style={{fontSize:11,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>Page {page} of {totalPages} · {data?.total} results</span>
            <div style={{display:'flex',gap:6}}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="btn-ghost" style={{padding:'6px 10px'}}><ChevronLeft size={13}/></button>
              <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="btn-ghost" style={{padding:'6px 10px'}}><ChevronRight size={13}/></button>
            </div>
          </div>}
        </>
      )}
    </div>
  </div>
}
