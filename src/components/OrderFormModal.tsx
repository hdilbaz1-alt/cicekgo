'use client';
import { apiFetch } from '@/lib/api';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { orderService, OrderItem, OrderItemLine } from '@/services/orderService';
import { productService, ProductDto } from '@/services/productService';
import { adminService, UserDto } from '@/services/adminService';
import { CustomerDetail, customerService } from '@/services/customerService';
import CustomerPickerModal from './CustomerPickerModal';
import CopyButton from './CopyButton';
import PaymentMethodSelect from './PaymentMethodSelect';
import { PaymentMethodDto } from '@/services/paymentMethodService';
import { getApiUrl, getEndpoint } from '@/config/api';
import { can, P } from '@/lib/permissions';
import { useEscClose } from '@/lib/useEscClose';
import { locationService, Province, District } from '@/services/locationService';
import { formatFullAddress } from '@/lib/address';
import GoogleMapPickerModal from './GoogleMapPickerModal';
import { MapPin } from 'lucide-react';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const SOURCES = ['Telefon', 'WhatsApp', 'Instagram', 'Web Sitesi', 'Mağaza', 'Trendyol', 'Diğer'];

interface DefaultAddress { provinceName?: string; districtName?: string }
function readDefaultAddress(): DefaultAddress | null {
  try {
    const u = JSON.parse(localStorage.getItem('user') || '{}');
    const raw = localStorage.getItem(`cg_default_address_${u.userId ?? u.id ?? ''}`);
    return raw ? (JSON.parse(raw) as DefaultAddress) : null;
  } catch { return null; }
}
const eqTr = (a: string, b: string) => a.toLocaleLowerCase('tr-TR') === b.toLocaleLowerCase('tr-TR');
const money = (n: number) => `${(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`;
const inputCls = 'w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm';
const lbl = 'text-xs font-medium text-slate-600';

export default function OrderFormModal({ isOpen, onClose, onSuccess, order }: {
  isOpen: boolean; onClose: () => void; onSuccess: () => void; order?: OrderItem | null;
}) {
  const isEdit = !!order;
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [couriers, setCouriers] = useState<UserDto[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  // Form state
  const [items, setItems] = useState<OrderItemLine[]>([]);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [saveAsNew, setSaveAsNew] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  // Yapısal teslimat adresi
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [provinceId, setProvinceId] = useState<number | ''>('');
  const [districtId, setDistrictId] = useState<number | ''>('');
  const [pendingProvinceName, setPendingProvinceName] = useState<string | null>(null);
  const [pendingDistrictName, setPendingDistrictName] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(todayStr());
  const [deliveryTimeRange, setDeliveryTimeRange] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [source, setSource] = useState('Telefon');
  const [status, setStatus] = useState('Yeni');
  const [discountTotal, setDiscountTotal] = useState('0');
  const [discountMode, setDiscountMode] = useState<'amount' | 'percent'>('amount');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [extraFee, setExtraFee] = useState('0');
  const [cardNote, setCardNote] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isNotified, setIsNotified] = useState(false);
  const [courierId, setCourierId] = useState<number | ''>('');
  const [paymentStatus, setPaymentStatus] = useState('');   // '' = otomatik
  const [paidAmount, setPaidAmount] = useState('0');
  const [paidTouched, setPaidTouched] = useState(false);
  const [alreadyPaid, setAlreadyPaid] = useState(0);   // düzenlemede: zaten alınan toplam
  const [extraPaid, setExtraPaid] = useState('');       // düzenlemede: bu güncellemede ek tahsilat
  const [methodId, setMethodId] = useState<number | ''>('');
  const [pmList, setPmList] = useState<PaymentMethodDto[]>([]);
  const [adv, setAdv] = useState(false);

  // Müşteri seçimi
  const [customerLabel, setCustomerLabel] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  // Ürün ekleme
  const [productPick, setProductPick] = useState<number | ''>('');

  const resetForm = useCallback(() => {
    setItems([]); setCustomerId(undefined); setSaveAsNew(false); setSenderName(''); setSenderPhone('');
    setRecipientName(''); setRecipientPhone('');
    setProvinceId(''); setDistrictId(''); setDistricts([]); setAddressLine('');
    // Varsayılan adres (kullanıcı bazlı, localStorage) → İl (ve varsa İlçe) ön-dolu gelir
    const def = readDefaultAddress();
    setPendingProvinceName(def?.provinceName || null);
    setPendingDistrictName(def?.districtName || null);
    setDeliveryDate(todayStr()); setDeliveryTimeRange(''); setSource('Telefon'); setStatus('Yeni');
    setDiscountTotal('0'); setDeliveryFee('0'); setExtraFee('0');
    setCardNote(''); setCustomerNote(''); setExtraNote(''); setDeliveryNote('');
    setIsNotified(false); setCourierId(''); setPaymentStatus(''); setPaidAmount('0');
    setAlreadyPaid(0); setExtraPaid(''); setMethodId('');
    setCustomerLabel(''); setErr('');
  }, []);

  const pickCustomer = (c: CustomerDetail) => {
    setCustomerId(c.customerId);
    setCustomerLabel(c.customerName);
    setSenderName(c.customerName);
    setSenderPhone(c.phone || '');
    setShowPicker(false);
  };

  // Yükle: ürünler + durumlar + kuryeler; edit ise sipariş detayını doldur
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const [prods] = await Promise.all([productService.list().catch(() => [])]);
        setProducts(prods);
      } catch { /* yoksay */ }
      // statuses
      try {
        const token = localStorage.getItem('token');
        const res = await apiFetch(getApiUrl(getEndpoint('ORDER_STATUS_LIST')), { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        const names = (body.data || []).map((s: { statusName: string }) => s.statusName);
        setStatuses(names.length ? names : ['Yeni', 'Hazırlanıyor', 'Hazır', 'Kuryeye Verildi', 'Teslim Edildi', 'İptal Edildi']);
      } catch { setStatuses(['Yeni', 'Hazırlanıyor', 'Hazır', 'Kuryeye Verildi', 'Teslim Edildi', 'İptal Edildi']); }
      if (can(P.ordersAssignCourier)) { try { setCouriers(await adminService.listCouriers()); } catch { /* yoksay */ } }
      // Teslimat saat aralıkları (mağaza çalışma saatlerinden)
      try {
        const token = localStorage.getItem('token');
        const res = await apiFetch(getApiUrl(getEndpoint('STORE_SETTINGS')), { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json();
        setSlots(body.data?.deliverySlots || []);
      } catch { setSlots([]); }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (order) {
      // edit: detayı çek (kalemler dahil)
      (async () => {
        try {
          const d = await orderService.getOrderDetail(order.orderCode);
          setItems((d.items || []).map((i) => ({ ...i })));
          setCustomerId(d.customerId ?? undefined);
          setCustomerLabel(d.customerId ? (d.senderName || '') : '');
          setSenderName(d.senderName || ''); setSenderPhone(d.senderPhone || '');
          setRecipientName(d.recipientName || ''); setRecipientPhone(d.recipientPhone || '');
          // Yapısal adres varsa onu çöz; yoksa legacy serbest adresi Açık Adres'e koy
          setProvinceId(''); setDistrictId(''); setDistricts([]);
          setPendingProvinceName(d.recipientCity || null);
          setPendingDistrictName(d.recipientDistrict || null);
          setAddressLine(d.recipientAddressLine || (d.recipientCity ? '' : (d.recipientAddress || '')));
          setDeliveryDate(d.deliveryDate ? d.deliveryDate.slice(0, 10) : todayStr());
          setDeliveryTimeRange(d.deliveryTimeRange || ''); setSource(d.source || 'Telefon');
          setStatus(d.orderStatus || 'Yeni');
          setDiscountTotal(String(d.discountTotal ?? 0)); setDeliveryFee(String(d.deliveryFee ?? 0)); setExtraFee(String(d.extraFee ?? 0));
          setCardNote(d.cardNote || ''); setCustomerNote(d.customerNote || ''); setExtraNote(d.extraNote || ''); setDeliveryNote(d.deliveryNote || '');
          setIsNotified(d.isNotified); setCourierId(d.assignedCourierId ?? '');
          setPaymentStatus(''); setPaidAmount('0');
          setAlreadyPaid(d.totalPaid ?? 0); setExtraPaid('');
        } catch (e) { setErr(e instanceof Error ? e.message : 'Sipariş yüklenemedi'); }
      })();
    } else {
      resetForm();
    }
  }, [isOpen, order, resetForm]);

  // İl/İlçe yükleme + bekleyen isim çözümleme (prefill/edit/harita için)
  useEffect(() => { if (isOpen) locationService.getProvinces().then(setProvinces).catch(() => { }); }, [isOpen]);
  useEffect(() => {
    if (!pendingProvinceName || provinces.length === 0) return;
    const p = provinces.find((x) => eqTr(x.name, pendingProvinceName));
    if (p) setProvinceId(p.id);
    setPendingProvinceName(null);
  }, [provinces, pendingProvinceName]);
  useEffect(() => {
    if (provinceId === '') { setDistricts([]); return; }
    locationService.getDistricts(Number(provinceId)).then(setDistricts).catch(() => setDistricts([]));
  }, [provinceId]);
  useEffect(() => {
    if (!pendingDistrictName || districts.length === 0) return;
    const d = districts.find((x) => eqTr(x.name, pendingDistrictName));
    if (d) setDistrictId(d.id);
    setPendingDistrictName(null);
  }, [districts, pendingDistrictName]);

  const provinceName = useMemo(() => provinces.find((p) => p.id === provinceId)?.name || '', [provinces, provinceId]);
  const districtName = useMemo(() => districts.find((d) => d.id === districtId)?.name || '', [districts, districtId]);
  const addressPreview = useMemo(() => formatFullAddress(addressLine, districtName, provinceName), [addressLine, districtName, provinceName]);

  const addProductLine = (pid: number) => {
    const p = products.find((x) => x.id === pid);
    if (!p) return;
    setItems((prev) => [...prev, { productId: p.id, productName: p.name, quantity: 1, unitPrice: p.salePrice, discount: 0 }]);
    setProductPick('');
  };
  const addManualLine = () => setItems((prev) => [...prev, { productName: '', quantity: 1, unitPrice: 0, discount: 0 }]);
  const updateLine = (idx: number, patch: Partial<OrderItemLine>) =>
    setItems((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const removeLine = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const totals = useMemo(() => {
    const sub = items.reduce((s, it) => s + Math.max(0, (it.quantity || 0) * (it.unitPrice || 0) - (it.discount || 0)), 0);
    const discAmt = discountMode === 'percent'
      ? sub * (Number(discountTotal) || 0) / 100
      : (Number(discountTotal) || 0);
    const grand = Math.max(0, sub - discAmt + (Number(deliveryFee) || 0) + (Number(extraFee) || 0));
    const paid = Number(paidAmount) || 0;
    return { sub, discAmt, grand, paid, remaining: Math.max(0, grand - paid) };
  }, [items, discountTotal, discountMode, deliveryFee, extraFee, paidAmount]);

  useEscClose(onClose, isOpen);
  // Açılışta durumları sıfırla; oluşturmada ödeme varsayılan = tam tutar
  useEffect(() => { if (isOpen) { setBusy(false); setPaidTouched(false); } }, [isOpen]);
  useEffect(() => { if (!isEdit && !paidTouched) setPaidAmount(String(totals.grand)); }, [totals.grand, paidTouched, isEdit]);

  const submit = async () => {
    setErr('');
    if (items.length === 0) return setErr('En az bir ürün kalemi ekleyin.');
    if (items.some((i) => !i.productName.trim())) return setErr('Tüm kalemlerde ürün adı olmalı.');
    if (!recipientName.trim()) return setErr('Alıcı adı gerekli.');
    if (provinceId === '') return setErr('Teslimat için İl seçin.');
    if (districtId === '') return setErr('Teslimat için İlçe seçin.');
    if (!isEdit && (Number(paidAmount) || 0) > 0 && !methodId) return setErr('Ödeme yöntemi seçin.');
    if (isEdit && (Number(extraPaid) || 0) > 0 && !methodId) return setErr('Ödeme yöntemi seçin.');
    setBusy(true);
    // Müşteri seçili değilse ve "yeni müşteri kaydet" işaretliyse gönderici bilgisiyle oluştur
    let cid = customerId;
    if (!cid && saveAsNew && senderName.trim()) {
      try { cid = await customerService.createCustomer({ customerName: senderName.trim(), phone: senderPhone || undefined }); }
      catch (e) { setErr(e instanceof Error ? `Müşteri kaydedilemedi: ${e.message}` : 'Müşteri kaydedilemedi'); setBusy(false); return; }
    }
    const extra = isEdit ? (Number(extraPaid) || 0) : 0;
    const startTime = deliveryTimeRange ? deliveryTimeRange.split(' - ')[0] : '09:00';
    const deliveryIso = `${deliveryDate || todayStr()}T${startTime}:00`;
    const payload = {
      orderStatus: status,
      orderSender: senderName, orderTo: recipientName,
      orderDeliveryDate: deliveryIso,
      orderProductType: items[0]?.productName || '',
      customerId: cid, senderName, senderPhone, recipientName, recipientPhone,
      recipientCity: provinceName, recipientDistrict: districtName, recipientAddressLine: addressLine,
      recipientAddress: addressPreview,
      extraNote, cardNote, customerNote, deliveryNote, isNotified,
      source, deliveryTimeRange,
      discountTotal: Math.round(totals.discAmt * 100) / 100, deliveryFee: Number(deliveryFee) || 0, extraFee: Number(extraFee) || 0,
      assignedCourierId: courierId === '' ? null : Number(courierId),
      paymentStatus: paymentStatus || undefined,
      items: items.map((i) => ({ productId: i.productId ?? null, productName: i.productName, quantity: Number(i.quantity) || 0, unitPrice: Number(i.unitPrice) || 0, discount: Number(i.discount) || 0 })),
      payments: !isEdit
        ? (Number(paidAmount) > 0 ? [{ paymentAmount: Number(paidAmount), paymentMethodId: Number(methodId) || 0, paymentDate: new Date().toISOString() }] : [])
        : ((extra > 0 && !cid) ? [{ paymentAmount: extra, paymentMethodId: Number(methodId) || 0, paymentDate: new Date().toISOString() }] : []),
    };
    try {
      if (isEdit && order) {
        await orderService.updateOrder(order.orderCode, { ...payload, orderPkId: order.orderPkId, replacePayments: false, replaceItems: true } as never);
        // Cariye bağlı ek tahsilat → kalanı düşer + cari alacak + kasa kaydı
        if (extra > 0 && cid) {
          const token = localStorage.getItem('token');
          await apiFetch(getApiUrl(getEndpoint('CUSTOMER_LEDGER_ORDER_PAYMENT')), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ customerId: cid, orderCode: order.orderCode, amount: extra, description: '', paymentMethodId: Number(methodId) || null, paymentDate: new Date().toISOString() }),
          });
        }
      } else {
        await orderService.createOrder(payload as never);
      }
      onSuccess(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : 'Kaydedilemedi'); setBusy(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-4 max-h-[94dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <h3 className="text-lg font-bold text-slate-900">{isEdit ? `Sipariş Düzenle · ${order?.orderCode}` : 'Yeni Sipariş'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Müşteri */}
          <section>
            <label className={lbl}>Müşteri (cari)</label>
            <div className="mt-1 flex gap-2">
              <div className="relative flex-1">
                <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <input readOnly onClick={() => setShowPicker(true)} value={customerLabel} placeholder="Müşteri seç (cari)" className={inputCls + ' pl-10 cursor-pointer'} />
              </div>
              <button type="button" onClick={() => setShowPicker(true)} title="Müşteri seç"
                className="px-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </button>
              {customerId && (
                <button type="button" onClick={() => { setCustomerId(undefined); setCustomerLabel(''); setSenderName(''); setSenderPhone(''); }} title="Kaldır" className="px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">×</button>
              )}
            </div>
            {customerId && <span className="text-[11px] text-emerald-600 mt-1 inline-block">✓ Cariye bağlı (#{customerId})</span>}
          </section>

          {/* Gönderici / Alıcı */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div><div className="flex items-center justify-between"><label className={lbl}>Gönderici Ad</label><CopyButton value={senderName} /></div><input className={inputCls + ' mt-1'} value={senderName} onChange={(e) => setSenderName(e.target.value)} /></div>
            <div><div className="flex items-center justify-between"><label className={lbl}>Gönderici Tel</label><CopyButton value={senderPhone} /></div><input type="tel" inputMode="numeric" maxLength={11} placeholder="05531234567" className={inputCls + ' mt-1'} value={senderPhone} onChange={(e) => setSenderPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} /></div>
            {!isEdit && !customerId && senderName.trim() && (
              <label className="sm:col-span-2 flex items-center gap-2.5 bg-indigo-50 border border-indigo-100 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={saveAsNew} onChange={(e) => setSaveAsNew(e.target.checked)} className="w-4 h-4 rounded accent-indigo-600" />
                <span><b>{senderName.trim()}</b> kişisini yeni müşteri olarak kaydet (gönderici ad/tel ile). Detayları sonra Müşteriler sayfasından güncelleyebilirsin.</span>
              </label>
            )}
            <div><div className="flex items-center justify-between"><label className={lbl}>Alıcı Ad *</label><CopyButton value={recipientName} /></div><input className={inputCls + ' mt-1'} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} /></div>
            <div><div className="flex items-center justify-between"><label className={lbl}>Alıcı Tel</label><CopyButton value={recipientPhone} /></div><input type="tel" inputMode="numeric" maxLength={11} placeholder="05531234567" className={inputCls + ' mt-1'} value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value.replace(/\D/g, '').slice(0, 11))} /></div>
            {/* Teslimat Adresi: İl / İlçe (zorunlu) + Açık Adres + harita */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <label className={lbl}>Teslimat Adresi *</label>
                <button type="button" onClick={() => setShowMap(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700">
                  <MapPin className="w-3.5 h-3.5" /> Konum / Haritadan Seç
                </button>
              </div>
              <div className="mt-1 grid sm:grid-cols-2 gap-2">
                <select className={inputCls} value={provinceId}
                  onChange={(e) => { const v = e.target.value === '' ? '' : Number(e.target.value); setProvinceId(v); setDistrictId(''); setPendingDistrictName(null); }}>
                  <option value="">İl seçin</option>
                  {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select className={inputCls} value={districtId} disabled={provinceId === ''}
                  onChange={(e) => setDistrictId(e.target.value === '' ? '' : Number(e.target.value))}>
                  <option value="">{provinceId === '' ? 'Önce il seçin' : 'İlçe seçin'}</option>
                  {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <textarea className={inputCls + ' mt-2'} rows={2} value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                placeholder="Açık adres (mahalle, sokak, site, bina/kapı no…)" />
              {addressPreview && (
                <div className="mt-2 flex items-start gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-[10px] font-medium text-slate-400 mt-0.5 shrink-0">ÖNİZLEME</span>
                  <span className="text-xs text-slate-700 leading-snug">{addressPreview}</span>
                </div>
              )}
            </div>
          </section>

          {/* Teslimat */}
          <section className="grid sm:grid-cols-2 gap-4">
            <div><label className={lbl}>Teslimat Tarihi</label><input type="date" className={inputCls + ' mt-1'} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
            <div>
              <label className={lbl}>Saat Aralığı</label>
              <select className={inputCls + ' mt-1'} value={deliveryTimeRange} onChange={(e) => setDeliveryTimeRange(e.target.value)}>
                <option value="">Seçiniz</option>
                {!slots.includes(deliveryTimeRange) && deliveryTimeRange && <option value={deliveryTimeRange}>{deliveryTimeRange}</option>}
                {slots.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </section>

          {/* Kalemler */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-slate-800">Ürün Kalemleri</label>
              <div className="flex gap-2">
                <select className={inputCls + ' !py-2 !w-44'} value={productPick} onChange={(e) => { const v = e.target.value; if (v) addProductLine(Number(v)); }}>
                  <option value="">+ Katalogdan ekle</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({money(p.salePrice)})</option>)}
                </select>
                <button type="button" onClick={addManualLine} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-medium">+ Elle</button>
              </div>
            </div>
            <div className="space-y-2">
              {items.length === 0 && <p className="text-sm text-slate-400 py-3 text-center bg-slate-50 rounded-xl">Henüz kalem yok. Katalogdan veya elle ekleyin.</p>}
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 rounded-xl p-2">
                  <input className="col-span-5 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white" value={it.productName} onChange={(e) => updateLine(idx, { productName: e.target.value })} placeholder="Ürün adı" />
                  <input type="number" className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white" value={it.quantity} onChange={(e) => updateLine(idx, { quantity: Number(e.target.value) })} placeholder="Adet" />
                  <input type="number" className="col-span-2 px-2 py-1.5 rounded-lg border border-slate-200 text-sm bg-white" value={it.unitPrice} onChange={(e) => updateLine(idx, { unitPrice: Number(e.target.value) })} placeholder="Fiyat" />
                  <div className="col-span-2 text-right text-sm font-medium text-slate-700">{money(Math.max(0, (it.quantity || 0) * (it.unitPrice || 0) - (it.discount || 0)))}</div>
                  <button type="button" onClick={() => removeLine(idx)} className="col-span-1 text-red-500 hover:text-red-600 text-lg">×</button>
                </div>
              ))}
            </div>
          </section>

          {/* Düzenlemede: ödeme özeti + ek tahsilat */}
          {isEdit && (
            <section className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Yeni genel toplam</span><b className="text-slate-900">{money(totals.grand)}</b></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Zaten alınan</span><b className="text-emerald-600">{money(alreadyPaid)}</b></div>
              <div className="flex items-center justify-between text-sm"><span className="text-slate-500">Güncel kalan</span><b className="text-orange-600">{money(Math.max(0, totals.grand - alreadyPaid - (Number(extraPaid) || 0)))}</b></div>
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className={lbl}>Bu güncellemede ek tahsilat</label>
                  <input type="number" className={inputCls + ' mt-1'} value={extraPaid} onChange={(e) => setExtraPaid(e.target.value)} placeholder="0" />
                </div>
                {(Number(extraPaid) || 0) > 0 && (
                  <div>
                    <label className={lbl}>Ödeme Yöntemi *</label>
                    <PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} />
                  </div>
                )}
                <span className="sm:col-span-2 text-[11px] text-slate-400">Ürün/fiyat değişince borç otomatik güncellenir. Burada şimdi alınan tutarı girebilirsin.</span>
              </div>
            </section>
          )}

          {/* Ödeme (esas) + Kart Notu */}
          <section className="grid sm:grid-cols-2 gap-4">
            {!isEdit && (
              <div>
                <label className={lbl}>Alınan Ödeme</label>
                <input type="number" className={inputCls + ' mt-1'} value={paidAmount} onChange={(e) => { setPaidTouched(true); setPaidAmount(e.target.value); }} />
                <span className="text-[11px] text-slate-400">Varsayılan: tam tutar</span>
              </div>
            )}
            {!isEdit && (Number(paidAmount) || 0) > 0 && (
              <div>
                <label className={lbl}>Ödeme Yöntemi *</label>
                <PaymentMethodSelect value={methodId} onChange={setMethodId} methods={pmList} setMethods={setPmList} className={inputCls + ' mt-1'} />
              </div>
            )}
            <div className={isEdit ? 'sm:col-span-2' : ''}><label className={lbl}>Kart Notu</label><textarea className={inputCls + ' mt-1'} rows={2} value={cardNote} onChange={(e) => setCardNote(e.target.value)} placeholder="Karta yazılacak mesaj" /></div>
          </section>

          {/* Gelişmiş ayarlar (gizli) */}
          <div className="border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setAdv((v) => !v)} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-800">
              <span className={`transition-transform ${adv ? 'rotate-90' : ''}`}>▸</span>
              Gelişmiş ayarlar (kaynak, indirim/ücret, kurye, notlar)
            </button>
            {adv && (
              <div className="mt-4 space-y-5">
                <section className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Sipariş Kaynağı</label>
                    <select className={inputCls + ' mt-1'} value={source} onChange={(e) => setSource(e.target.value)}>
                      {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Durum</label>
                    <select className={inputCls + ' mt-1'} value={status} onChange={(e) => setStatus(e.target.value)}>
                      {!statuses.includes(status) && <option value={status}>{status}</option>}
                      {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </section>
                <section className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>Genel İndirim</label>
                    <div className="mt-1 flex">
                      <input type="number" className={inputCls + ' rounded-r-none'} value={discountTotal} onChange={(e) => setDiscountTotal(e.target.value)} />
                      <button type="button" onClick={() => setDiscountMode((m) => m === 'amount' ? 'percent' : 'amount')}
                        className="px-3 rounded-r-xl border border-l-0 border-slate-200 bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-600 w-12">
                        {discountMode === 'amount' ? '₺' : '%'}
                      </button>
                    </div>
                    {discountMode === 'percent' && <span className="text-[11px] text-slate-400">= {money(totals.discAmt)}</span>}
                  </div>
                  <div><label className={lbl}>Teslimat Ücreti</label><input type="number" className={inputCls + ' mt-1'} value={deliveryFee} onChange={(e) => setDeliveryFee(e.target.value)} /></div>
                  <div><label className={lbl}>Ek Ücret</label><input type="number" className={inputCls + ' mt-1'} value={extraFee} onChange={(e) => setExtraFee(e.target.value)} /></div>
                </section>
                <section className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>Ödeme Durumu</label>
                    <select className={inputCls + ' mt-1'} value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
                      <option value="">Otomatik (ödenene göre)</option>
                      <option value="Ödendi">Ödendi</option>
                      <option value="Kısmi">Kısmi</option>
                      <option value="Ödenmedi">Ödenmedi</option>
                      <option value="Veresiye">Veresiye</option>
                    </select>
                  </div>
                  {can(P.ordersAssignCourier) && (
                    <div>
                      <label className={lbl}>Kurye</label>
                      <select className={inputCls + ' mt-1'} value={courierId} onChange={(e) => setCourierId(e.target.value === '' ? '' : Number(e.target.value))}>
                        <option value="">— Atanmadı —</option>
                        {couriers.map((c) => <option key={c.id} value={c.id}>{c.fullName || c.username}</option>)}
                      </select>
                    </div>
                  )}
                </section>
                <section className="grid sm:grid-cols-2 gap-4">
                  <div><label className={lbl}>Müşteri Notu</label><textarea className={inputCls + ' mt-1'} rows={2} value={customerNote} onChange={(e) => setCustomerNote(e.target.value)} /></div>
                  <div><label className={lbl}>İç Not</label><textarea className={inputCls + ' mt-1'} rows={2} value={extraNote} onChange={(e) => setExtraNote(e.target.value)} /></div>
                  <div><label className={lbl}>Teslimat Notu</label><textarea className={inputCls + ' mt-1'} rows={2} value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} /></div>
                </section>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="checkbox" checked={isNotified} onChange={(e) => setIsNotified(e.target.checked)} className="w-4 h-4 rounded accent-blue-600" />
                  Müşteriye bildirim gönderilsin
                </label>
              </div>
            )}
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        {/* Özet + aksiyon */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 px-6 py-4 rounded-b-3xl">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm mb-3">
            <span className="text-slate-500">Ara Toplam: <b className="text-slate-800">{money(totals.sub)}</b></span>
            <span className="text-slate-500">Genel Toplam: <b className="text-slate-900">{money(totals.grand)}</b></span>
            {!isEdit && <span className="text-slate-500">Kalan: <b className="text-orange-600">{money(totals.remaining)}</b></span>}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
            <button onClick={submit} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold shadow-lg shadow-blue-600/25 disabled:opacity-50">
              {busy ? 'Kaydediliyor…' : (isEdit ? 'Güncelle' : 'Siparişi Oluştur')}
            </button>
          </div>
        </div>
      </div>

      {showPicker && <CustomerPickerModal onClose={() => setShowPicker(false)} onPick={pickCustomer} />}
      {showMap && (
        <GoogleMapPickerModal
          onClose={() => setShowMap(false)}
          onPick={({ provinceName: pn, districtName: dn, addressLine: al }) => {
            if (al) setAddressLine(al);
            // İl/İlçe'yi isimle çöz (cascading effect'ler id'leri ayarlar)
            if (pn) { setProvinceId(''); setDistrictId(''); setDistricts([]); setPendingProvinceName(pn); setPendingDistrictName(dn || null); }
            setShowMap(false);
          }}
        />
      )}
    </div>
  );
}
