import { LoaderCircle, AlertCircle, Sprout, PackageOpen } from 'lucide-react'
import { statusLabel } from '../utils/format'

export function Button({ children, variant='primary', className='', ...props }) {
  return <button className={`btn btn-${variant} ${className}`} {...props}>{children}</button>
}
export function Field({ label, ...props }) {
  return <label className="field"><span>{label}</span>{props.as === 'textarea'
    ? <textarea {...props} />
    : props.as === 'select'
      ? <select {...props}>{props.children}</select>
      : <input {...props} />}</label>
}
export function PageTitle({ eyebrow, title, description, action }) {
  return <div className="page-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}
export function Status({ value }) { return <span className={`status status-${value}`}>{statusLabel(value)}</span> }
export function Loading() { return <div className="state"><LoaderCircle className="spin" size={28}/><span>جارٍ تحميل البيانات...</span></div> }
export function Empty({ title='لا توجد بيانات بعد', text='ستظهر البيانات هنا عند توفرها.' }) { return <div className="state empty"><PackageOpen size={34}/><b>{title}</b><span>{text}</span></div> }
export function ErrorBox({ message }) { return message ? <div className="error-box"><AlertCircle size={18}/>{message}</div> : null }
export function CropCard({ crop, onBuy }) {
  return <article className="listing-card">
    <div className="listing-image"><img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=900&q=85" alt="محاصيل زراعية"/><span className="image-tag">محصول زراعي</span></div>
    <div className="listing-body"><div className="card-line"><span className="eyebrow">{crop.category?.name || 'منتجات زراعية'}</span><Status value={crop.status}/></div>
      <h3>{crop.name}</h3><p className="muted">{crop.region?.name || 'منطقة غير محددة'} · {crop.seller?.name || 'مزارع'}</p>
      <div className="listing-meta"><div><b>{crop.availableQuantity} {crop.unit}</b><small>الكمية المتاحة</small></div><div className="price"><b>{crop.pricePerUnit}</b><small>السعر لكل {crop.unit}</small></div></div>
      {onBuy && <Button onClick={() => onBuy(crop)}>طلب شراء مباشر</Button>}
    </div>
  </article>
}
export function RequestCard({ request, action }) {
 return <article className="request-card"><div className="request-icon"><Sprout size={22}/></div><div className="request-content"><div className="card-line"><span className="eyebrow">{request.category?.name || 'طلب توريد'}</span><Status value={request.status}/></div><h3>{request.name}</h3><p className="muted">{request.region?.name || 'منطقة غير محددة'} · {request.buyer?.name || 'تاجر'}</p><p>{request.description || 'لا يوجد وصف إضافي.'}</p><div className="request-bottom"><b>{request.quantity} {request.unit}</b>{action}</div></div></article>
}
