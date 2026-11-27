export const units = ['kg', 'ton', 'piece', 'box']
export const unitLabel = (unit) => ({ kg: 'كغ', ton: 'طن', piece: 'قطعة', box: 'صندوق' }[unit] || unit || '—')
export const statusLabel = (status) => ({
  active: 'متاح', unavailable: 'غير متاح', soldOut: 'نفد المخزون', cancelled: 'ملغي',
  open: 'مفتوح', closed: 'مغلق', pending: 'قيد الانتظار', accepted: 'مقبول',
  rejected: 'مرفوض', withdrawn: 'مسحوب', pendingConfirmation: 'بانتظار التأكيد',
  confirmed: 'تم التأكيد', inProgress: 'قيد التنفيذ', completed: 'مكتمل', disputed: 'متنازع عليه'
}[status] || status || '—')
export const money = (value) => Number(value || 0).toLocaleString('ar-SY')
export const date = (value) => value ? new Date(value).toLocaleDateString('ar-SY') : '—'
