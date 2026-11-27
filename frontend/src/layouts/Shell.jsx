import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Sprout, Menu, X, LayoutDashboard, Wheat, ClipboardList, Handshake, LogOut, UserRound, PlusCircle, Tags, MapPin } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const links = {
 farmer: [['/dashboard','لوحة التحكم',LayoutDashboard],['/my-crops','محاصيلي',Wheat],['/crops/new','إضافة محصول',PlusCircle],['/requests','طلبات التوريد',ClipboardList],['/agreements','اتفاقياتي',Handshake]],
 trader: [['/dashboard','لوحة التحكم',LayoutDashboard],['/my-requests','طلباتي',ClipboardList],['/requests/new','إنشاء طلب',PlusCircle],['/crops','تصفح المحاصيل',Wheat],['/agreements','اتفاقياتي',Handshake]],
 admin: [['/dashboard','لوحة التحكم',LayoutDashboard],['/admin/categories','التصنيفات',Tags],['/admin/regions','المناطق',MapPin]]
}
export function PublicLayout() {
 const { user, logout } = useAuth()
 return <><header className="public-nav"><Link to="/" className="brand"><span className="brand-icon"><Sprout/></span><span>حصاد<small>سوقك الزراعي</small></span></Link><nav><NavLink to="/crops">المحاصيل</NavLink><NavLink to="/requests">طلبات التوريد</NavLink></nav><div className="nav-actions">{user ? <><Link className="nav-user" to="/dashboard"><UserRound size={17}/>{user.name}</Link><button className="text-button" onClick={logout}>خروج</button></> : <><Link to="/login" className="login-link">تسجيل الدخول</Link><Link to="/register" className="btn btn-primary">ابدأ الآن</Link></>}</div></header><main><Outlet/></main><footer className="footer"><div className="brand"><span className="brand-icon"><Sprout/></span><span>حصاد<small>من أرضنا إلى سوقك</small></span></div><p>منصة تربط المزارعين والتجار وتسهّل الوصول إلى المنتجات الزراعية.</p><span>© {new Date().getFullYear()} حصاد</span></footer></>
}
export function DashboardLayout() {
 const { user, logout } = useAuth()
 const [open,setOpen] = useState(false)
 const navigate=useNavigate()
 const items=links[user?.role] || []
 return <div className="dashboard-shell">
  <aside className={`sidebar ${open?'sidebar-open':''}`}><Link to="/" className="brand"><span className="brand-icon"><Sprout/></span><span>حصاد<small>لوحة العمل</small></span></Link><div className="sidebar-user"><div className="avatar">{user?.name?.[0] || 'ح'}</div><div><b>{user?.name}</b><small>{user?.role==='farmer'?'مزارع':user?.role==='trader'?'تاجر':'مدير النظام'}</small></div></div><nav>{items.map(([to,label,Icon])=><NavLink key={to} to={to} onClick={()=>setOpen(false)}><Icon size={18}/>{label}</NavLink>)}</nav><button className="sidebar-logout" onClick={()=>{logout();navigate('/')}}><LogOut size={18}/>تسجيل الخروج</button></aside>
  {open && <button className="mobile-overlay" onClick={()=>setOpen(false)} aria-label="إغلاق القائمة"/>}
  <section className="dashboard-main"><header className="dashboard-top"><button className="menu-toggle" onClick={()=>setOpen(!open)} aria-label="القائمة">{open?<X/>:<Menu/>}</button><span>مرحباً، {user?.name}</span><Link to="/" className="site-link">العودة إلى الموقع ↗</Link></header><main className="dashboard-content"><Outlet/></main></section>
 </div>
}
