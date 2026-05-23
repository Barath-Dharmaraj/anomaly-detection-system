import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShieldAlert, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
export default function RegisterPage() {
  const [form,setForm]=useState({email:'',username:'',password:''})
  const [loading,setLoading]=useState(false)
  const register=useAuthStore(s=>s.register)
  const navigate=useNavigate()
  const handleSubmit=async(e)=>{
    e.preventDefault()
    if(form.password.length<6) return toast.error('Password min 6 chars')
    setLoading(true)
    try{await register(form.email,form.username,form.password);toast.success('Account created');navigate('/dashboard')}
    catch(err){toast.error(err.response?.data?.detail||'Registration failed')}
    finally{setLoading(false)}
  }
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:24}}>
      <div style={{width:'100%',maxWidth:400}} className="fade-in">
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:40}}>
          <div style={{width:32,height:32,borderRadius:7,background:'var(--bg-3)',border:'1px solid var(--border-2)',display:'flex',alignItems:'center',justifyContent:'center'}}><ShieldAlert size={16} color="var(--text-2)"/></div>
          <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:16,color:'var(--text)'}}>AnomalyGuard</span>
        </div>
        <h1 style={{fontFamily:'Syne,sans-serif',fontSize:26,fontWeight:700,color:'var(--text)',letterSpacing:'-0.03em',marginBottom:6}}>Create account</h1>
        <p style={{fontSize:13,color:'var(--text-3)',marginBottom:32}}>Set up your analyst workspace</p>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:16}}>
          <div><label className="label">Username</label><input type="text" required minLength={3} className="input-field" placeholder="analyst_01" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/></div>
          <div><label className="label">Email address</label><input type="email" required className="input-field" placeholder="you@company.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
          <div><label className="label">Password</label><input type="password" required minLength={6} className="input-field" placeholder="Min. 6 characters" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>
          <button type="submit" disabled={loading} className="btn-primary" style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginTop:8}}>
            {loading?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>Creating…</>:'Create account'}
          </button>
        </form>
        <div className="divider" style={{margin:'28px 0'}}/>
        <p style={{fontSize:13,color:'var(--text-3)',textAlign:'center'}}>Have an account?{' '}<Link to="/login" style={{color:'var(--text-2)',fontWeight:500,textDecoration:'none'}}>Sign in</Link></p>
      </div>
    </div>
  )
}
