import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sprout, ShieldCheck, Handshake, Search, Leaf, Users, ChevronLeft, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { errorMessage } from '../services/api'
import { Button, Field, PageTitle, Loading, Empty, ErrorBox, CropCard, RequestCard } from '../components/UI'
import { units, unitLabel, money } from '../utils/format'
import { useAuth } from '../context/AuthContext'

export function Home() {
 const [crops,setCrops]=useState([])
 useEffect(()=>{api.get('/crops').then(r=>setCrops(r.data.crops?.slice(0,3)||[])).catch(()=>{})},[])
 return <><section className="hero"><div className="hero-copy"><span className="hero-kicker"><Leaf size={16}/> منصة زراعية متكاملة</span><h1>نزرع الثقة،<br/><em>ونحصد الفرص.</em></h1><p>مساحة واحدة تجمع المزارعين والتجار، لتنظيم عرض المحاصيل وطلبات التوريد والاتفاقيات بكل وضوح.</p><div className="hero-actions"><Link className="btn btn-light" to="/crops">اكتشف المحاصيل <ArrowLeft size={18}/></Link><Link className="btn btn-outline-light" to="/register">انضم إلى حصاد</Link></div><div className="hero-trust"><span><ShieldCheck size={17}/> اتفاقيات واضحة</span><span><Users size={17}/> تواصل مباشر</span></div></div><div className="hero-photo"><div className="hero-photo-label"><Sprout size={18}/><span>خير الأرض… أقرب إليك</span></div></div></section>
 <section className="section container"><div className="section-heading"><div><span className="eyebrow">كيف تعمل حصاد؟</span><h2>سوق زراعي أكثر تنظيماً</h2><p>أدوات بسيطة لتنظيم رحلة البيع والشراء.</p></div></div><div className="feature-grid"><article><span><Sprout/></span><h3>اعرض محاصيلك</h3><p>أنشئ قوائم لمحاصيلك وحدد الكمية والسعر والمنطقة.</p></article><article><span><Search/></span><h3>اكتشف الفرص</h3><p>تصفح المحاصيل وطلبات التوريد المنشورة على المنصة.</p></article><article><span><Handshake/></span><h3>اتفاق واضح للطرفين</h3><p>تأكيد متبادل قبل حجز الكمية، مع متابعة حالة الاتفاقية.</p></article></div></section>
 <section className="section section-tint"><div className="container"><div className="section-heading"><div><span className="eyebrow">من السوق</span><h2>محاصيل متاحة</h2><p>تعرّف على أحدث المحاصيل المعروضة.</p></div><Link to="/crops" className="inline-link">عرض جميع المحاصيل <ChevronLeft size={17}/></Link></div>{crops.length?<div className="listing-grid">{crops.map(c=><CropCard key={c._id} crop={c}/>)}</div>:<div className="soft-empty">ابدأ بتصفح المحاصيل المنشورة في السوق.</div>}</div></section>
 <section className="cta container"><div><span className="eyebrow">ابدأ اليوم</span><h2>مكانك في سوق حصاد</h2><p>أنشئ حسابك وابدأ بعرض المحاصيل أو طلب التوريد.</p></div><Link className="btn btn-primary" to="/register">إنشاء حساب <ArrowLeft size={18}/></Link></section></>
}
export function BrowseCrops() {
 const {user}=useAuth(), navigate=useNavigate()
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 const [search,setSearch]=useState(''),[buyCrop,setBuyCrop]=useState(null),[quantity,setQuantity]=useState(''),[buyError,setBuyError]=useState(''),[busy,setBusy]=useState(false)
 useEffect(()=>{api.get('/crops').then(r=>setItems(r.data.crops||[])).catch(e=>setError(errorMessage(e))).finally(()=>setLoading(false))},[])
 const beginBuy=crop=>{if(!user){navigate('/login');return}setBuyCrop(crop);setQuantity('');setBuyError('')}
 const submitBuy=async e=>{
  e.preventDefault();const amount=Number(quantity)
  if(!Number.isFinite(amount)||amount<=0||amount>buyCrop.availableQuantity){setBuyError('أدخل كمية صحيحة لا تتجاوز الكمية المتاحة.');return}
  setBusy(true);setBuyError('')
  try{await api.post('/agreements',{crop:buyCrop._id,quantity:amount,unit:buyCrop.unit});setBuyCrop(null);navigate('/agreements')}
  catch(e){setBuyError(errorMessage(e))}
  finally{setBusy(false)}
 }
 const filtered=items.filter(x=>`${x.name} ${x.category?.name||''} ${x.region?.name||''}`.includes(search))
 return <div className="container page-wrap"><PageTitle eyebrow="السوق الزراعي" title="تصفّح المحاصيل" description="اكتشف المحاصيل المتاحة من المزارعين."/><div className="searchbar"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ابحث باسم المحصول أو المنطقة أو التصنيف"/></div><ErrorBox message={error}/>{loading?<Loading/>:filtered.length?<div className="listing-grid">{filtered.map(c=><CropCard key={c._id} crop={c} onBuy={beginBuy}/>)}</div>:<Empty title="لم نعثر على محاصيل" text="جرّب كلمة بحث أخرى أو عد لاحقاً."/ >}
 {buyCrop&&<div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setBuyCrop(null)}}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="buy-title"><button className="modal-close" onClick={()=>setBuyCrop(null)} aria-label="إغلاق"><X/></button><span className="eyebrow">اتفاقية شراء مباشر</span><h2 id="buy-title">طلب شراء {buyCrop.name}</h2><p>سيتم إنشاء اتفاقية بانتظار تأكيدك وتأكيد البائع. لا يتم حجز المخزون قبل تأكيد الطرفين.</p><div className="modal-summary"><span>الكمية المتاحة</span><b>{buyCrop.availableQuantity} {unitLabel(buyCrop.unit)}</b><span>السعر لكل وحدة</span><b>{money(buyCrop.pricePerUnit)}</b></div><form onSubmit={submitBuy}><Field label={`الكمية المطلوبة (${unitLabel(buyCrop.unit)})`} type="number" min=".01" max={buyCrop.availableQuantity} step="any" value={quantity} onChange={e=>setQuantity(e.target.value)} required/><ErrorBox message={buyError}/><div className="button-row"><Button disabled={busy}>{busy?'جارٍ إنشاء الاتفاقية...':'إنشاء الاتفاقية'}</Button><Button type="button" variant="soft" onClick={()=>setBuyCrop(null)}>إلغاء</Button></div></form></section></div>}
 </div>
}
export function BrowseRequests() {
 const {user}=useAuth()
 const [items,setItems]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState('')
 useEffect(()=>{api.get('/supply-requests').then(r=>setItems(r.data.supplyRequests||[])).catch(e=>setError(errorMessage(e))).finally(()=>setLoading(false))},[])
 return <div className="container page-wrap"><PageTitle eyebrow="فرص التوريد" title="طلبات التوريد" description="تعرّف على احتياجات التجار وقدّم عرضك كمزارع."/><ErrorBox message={error}/>{loading?<Loading/>:items.length?<div className="request-grid">{items.map(x=><RequestCard key={x._id} request={x} action={user?.role==='farmer'?<Link className="inline-link" to={`/requests/${x._id}/offer`}>تقديم عرض <ArrowLeft size={15}/></Link>:null}/>)}</div>:<Empty title="لا توجد طلبات توريد مفتوحة حالياً"/>}</div>
}
export function Login() {
 const {login}=useAuth(),navigate=useNavigate(),[form,setForm]=useState({phone:'',password:''}),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{await login(form);navigate('/dashboard')}catch(err){setError(errorMessage(err))}finally{setBusy(false)}}
 return <AuthFrame title="مرحباً بعودتك" subtitle="سجّل الدخول لمتابعة نشاطك في حصاد"><form onSubmit={submit}><Field label="رقم الهاتف" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required autoComplete="tel"/><Field label="كلمة المرور" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required autoComplete="current-password"/><ErrorBox message={error}/><Button disabled={busy} block>{busy?'جارٍ الدخول...':'تسجيل الدخول'}</Button></form><p className="auth-switch">ليس لديك حساب؟ <Link to="/register">أنشئ حساباً</Link></p></AuthFrame>
}
export function Register() {
 const {register}=useAuth(),navigate=useNavigate(),[form,setForm]=useState({name:'',phone:'',password:'',role:'farmer'}),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const submit=async e=>{e.preventDefault();if(form.password.length<8){setError('يجب ألا تقل كلمة المرور عن 8 أحرف');return}setBusy(true);setError('');try{await register(form);navigate('/dashboard')}catch(err){setError(errorMessage(err))}finally{setBusy(false)}}
 return <AuthFrame title="انضم إلى حصاد" subtitle="أنشئ حسابك وابدأ رحلتك في السوق الزراعي"><form onSubmit={submit}><Field label="الاسم الكامل" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/><Field label="رقم الهاتف" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/><Field label="كلمة المرور (8 أحرف على الأقل)" type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/><Field as="select" label="نوع الحساب" value={form.role} onChange={e=>setForm({...form,role:e.target.value})}><option value="farmer">مزارع</option><option value="trader">تاجر</option></Field><ErrorBox message={error}/><Button disabled={busy}>{busy?'جارٍ إنشاء الحساب...':'إنشاء حساب'}</Button></form><p className="auth-switch">لديك حساب بالفعل؟ <Link to="/login">سجّل الدخول</Link></p></AuthFrame>
}
function AuthFrame({title,subtitle,children}){return <div className="auth-page"><div className="auth-visual"><div><span className="brand-icon"><Sprout/></span><h2>خير الأرض<br/>يجمعنا.</h2><p>منصة حصاد تربط المنتج بالسوق بخطوات واضحة.</p></div></div><div className="auth-form-wrap"><div className="auth-form"><Link to="/" className="back-home">← العودة للرئيسية</Link><span className="eyebrow">أهلاً بك في حصاد</span><h1>{title}</h1><p>{subtitle}</p>{children}</div></div></div>}
