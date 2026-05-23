import{useState,useCallback}from'react'
import{useDropzone}from'react-dropzone'
import{Upload,FileText,Loader2,CheckCircle,XCircle,Download}from'lucide-react'
import{BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Cell}from'recharts'
import toast from'react-hot-toast'
import api from'@/utils/api'

export default function UploadPage(){
  const[result,setResult]=useState(null)
  const[loading,setLoading]=useState(false)
  const[file,setFile]=useState(null)
  const onDrop=useCallback(a=>{if(a[0])setFile(a[0])},[])
  const{getRootProps,getInputProps,isDragActive}=useDropzone({onDrop,accept:{'text/csv':['.csv']},maxFiles:1})

  const handleUpload=async()=>{
    if(!file)return toast.error('Select a CSV first')
    setLoading(true)
    try{
      const fd=new FormData();fd.append('file',file)
      const{data}=await api.post('/predict/upload',fd,{headers:{'Content-Type':'multipart/form-data'}})
      setResult(data);toast.success(`Processed ${data.total} rows`)
    }catch(err){toast.error(err.response?.data?.detail||'Upload failed')}
    finally{setLoading(false)}
  }

  const downloadResults=()=>{
    if(!result)return
    const header=Object.keys(result.results[0]).join(',')
    const rows=result.results.map(r=>Object.values(r).join(',')).join('\n')
    const blob=new Blob([header+'\n'+rows],{type:'text/csv'})
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`batch-${result.batch_id.slice(0,8)}.csv`;a.click()
  }

  const chartData=result?[{name:'Normal',value:result.normal_count,color:'var(--success)'},{name:'Anomaly',value:result.anomaly_count,color:'var(--danger)'}]:[]
  const TT=({active,payload})=>{if(!active||!payload?.length)return null;return<div style={{background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',fontSize:11,fontFamily:'DM Mono,monospace'}}><p style={{color:'var(--text-2)',margin:0}}>{payload[0].payload.name}: <strong>{payload[0].value}</strong></p></div>}

  return<div style={{padding:32,display:'flex',flexDirection:'column',gap:24}} className="fade-in">
    <div><div className="page-title">Batch Upload</div><div className="page-sub">Analyse up to 5,000 transactions from a CSV</div></div>
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:24}}>
      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        <div {...getRootProps()} style={{background:isDragActive?'var(--bg-3)':'var(--bg-2)',border:`1px dashed ${isDragActive?'var(--border-2)':'var(--border)'}`,borderRadius:8,padding:40,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center',cursor:'pointer',transition:'all .15s',minHeight:180}}>
          <input {...getInputProps()}/>
          <div style={{width:40,height:40,borderRadius:8,background:'var(--bg-3)',border:'1px solid var(--border)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:16}}><Upload size={18} color="var(--text-3)"/></div>
          {file?<><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><FileText size={14} color="var(--text-2)"/><span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'var(--text-2)'}}>{file.name}</span></div><span style={{fontSize:11,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>{(file.size/1024).toFixed(1)} KB</span></>
          :<><p style={{fontSize:13,color:'var(--text-2)',fontWeight:500,marginBottom:4}}>{isDragActive?'Drop here':'Drag & drop CSV'}</p><p style={{fontSize:11,color:'var(--text-3)',margin:0}}>or click to browse</p></>}
        </div>
        <div className="card-sm">
          <div className="section-tag" style={{marginBottom:10}}>Required columns</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {['amount','hour','day_of_week','merchant_cat','distance_km','trans_per_day','balance_ratio','is_international','velocity_1h'].map(col=><span key={col} style={{fontFamily:'DM Mono,monospace',fontSize:11,color:'var(--text-3)',background:'var(--bg-3)',border:'1px solid var(--border)',borderRadius:4,padding:'2px 8px'}}>{col}</span>)}
          </div>
        </div>
        <button onClick={handleUpload} disabled={!file||loading} className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
          {loading?<><Loader2 size={13} style={{animation:'spin 1s linear infinite'}}/>Processing…</>:<><Upload size={13}/>Run Batch Analysis</>}
        </button>
      </div>
      {result?(
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
              <div><div style={{fontSize:13,fontWeight:600,color:'var(--text)'}}>Batch Complete</div><div className="section-tag" style={{marginTop:2,fontFamily:'DM Mono,monospace',fontSize:10}}>{result.batch_id.slice(0,16)}…</div></div>
              <button onClick={downloadResults} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:12,fontFamily:'DM Mono,monospace'}}><Download size={12}/>Export</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
              {[['Total',result.total,FileText,'var(--text)'],['Normal',result.normal_count,CheckCircle,'var(--success)'],['Anomaly',result.anomaly_count,XCircle,'var(--danger)']].map(([label,value,Icon,color])=>(
                <div key={label} style={{textAlign:'center',padding:'16px 12px',background:'var(--bg-3)',borderRadius:6,border:'1px solid var(--border)'}}>
                  <Icon size={16} color={color} style={{margin:'0 auto 8px'}}/>
                  <div style={{fontFamily:'Syne,sans-serif',fontSize:22,fontWeight:700,color,letterSpacing:'-0.02em'}}>{value}</div>
                  <div style={{fontSize:10,color:'var(--text-3)',fontFamily:'DM Mono,monospace',marginTop:2}}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:10,background:'var(--bg-3)',borderRadius:6,border:'1px solid var(--border)'}}>
              <span style={{fontSize:12,color:'var(--text-3)',fontFamily:'DM Mono,monospace'}}>Anomaly rate:</span>
              <span style={{fontSize:13,fontWeight:700,color:'var(--danger)',fontFamily:'DM Mono,monospace'}}>{((result.anomaly_count/result.total)*100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="card">
            <div style={{fontSize:13,fontWeight:600,color:'var(--text)',marginBottom:16}}>Distribution</div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="name" stroke="var(--border-2)" tick={{fontSize:11,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
                <YAxis stroke="var(--border-2)" tick={{fontSize:10,fill:'var(--text-3)',fontFamily:'DM Mono,monospace'}}/>
                <Tooltip content={<TT/>}/>
                <Bar dataKey="value" radius={[4,4,0,0]}>{chartData.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',fontSize:12,fontWeight:600,color:'var(--text)'}}>Sample Results</div>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>{['Amount','Score','Risk','Status'].map(h=><th key={h} className="tbl-head" style={{textAlign:'left'}}>{h}</th>)}</tr></thead>
              <tbody>{result.results.slice(0,8).map((r,i)=><tr key={i} className="tbl-row" style={{background:r.is_anomaly?'#0f0808':'transparent'}}>
                <td style={{padding:'9px 16px',fontFamily:'DM Mono,monospace',fontSize:12}}>${parseFloat(r.amount).toFixed(2)}</td>
                <td style={{padding:'9px 16px',fontFamily:'DM Mono,monospace',fontSize:12,color:r.is_anomaly?'var(--danger)':'var(--success)'}}>{(r.anomaly_score*100).toFixed(0)}%</td>
                <td style={{padding:'9px 16px'}}><span className={`badge-risk-${r.risk_level}`}>{r.risk_level}</span></td>
                <td style={{padding:'9px 16px'}}>{r.is_anomaly?<span className="badge-anomaly">ANOMALY</span>:<span className="badge-normal">NORMAL</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      ):<div className="card" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:300,textAlign:'center'}}><Upload size={28} color="var(--text-3)" style={{marginBottom:12}}/><p style={{fontSize:13,color:'var(--text-3)',fontWeight:500}}>Upload a file to see results</p><p style={{fontSize:12,color:'var(--text-3)',marginTop:4,opacity:.6}}>Supports up to 5,000 rows</p></div>}
    </div>
  </div>
}
