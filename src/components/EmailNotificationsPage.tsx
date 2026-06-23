'use client';

import { useEffect, useRef, useState } from 'react';
import { emailService, type EmailSettings, type UpdateEmailSettings, type EmailTemplate, type MergeTag, type EmailTrigger } from '@/services/emailService';
import { useEscClose } from '@/lib/useEscClose';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Mail, Server, Send, BadgeCheck, AlertTriangle, LayoutTemplate, GitBranch, Loader2, Plus, Pencil, Trash2, Eye } from 'lucide-react';

const inputCls = 'w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm';

export default function EmailNotificationsPage() {
  const [s, setS] = useState<EmailSettings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [pwd, setPwd] = useState('');
  const [imapPwd, setImapPwd] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const note = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [tags, setTags] = useState<MergeTag[]>([]);
  const [editTpl, setEditTpl] = useState<EmailTemplate | null>(null);
  const [addingTpl, setAddingTpl] = useState(false);

  const [f, setF] = useState<UpdateEmailSettings>({
    fromName: '', fromEmail: '', smtpHost: '', smtpPort: 587, smtpSecurity: 'StartTls', smtpUsername: '',
    imapHost: '', imapPort: 993, imapUsername: '', sendToRecipient: true, sendToSender: false, dailyLimit: 500,
  });

  const loadAll = () => {
    emailService.getSettings().then((d) => {
      if (d) { setS(d); setF({ fromName: d.fromName, fromEmail: d.fromEmail, smtpHost: d.smtpHost, smtpPort: d.smtpPort, smtpSecurity: d.smtpSecurity, smtpUsername: d.smtpUsername, imapHost: d.imapHost || '', imapPort: d.imapPort || 993, imapUsername: d.imapUsername || '', sendToRecipient: d.sendToRecipient, sendToSender: d.sendToSender, dailyLimit: d.dailyLimit }); }
      setLoaded(true);
    });
    emailService.listTemplates().then(setTemplates);
    emailService.listTriggers().then(setTriggers);
    emailService.mergeTags().then(setTags);
  };
  useEffect(loadAll, []);

  const set = <K extends keyof UpdateEmailSettings>(k: K, v: UpdateEmailSettings[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!f.smtpHost.trim()) return note('SMTP sunucusu gerekli');
    if (!f.fromEmail.trim()) return note('Gönderen e-posta gerekli');
    setSaving(true);
    const r = await emailService.updateSettings({ ...f, smtpPassword: pwd || null, imapPassword: imapPwd || null });
    setSaving(false);
    if (r.ok) { if (r.data) setS(r.data); setPwd(''); setImapPwd(''); note('Ayarlar kaydedildi. Bağlantıyı test edin.'); emailService.listTriggers().then(setTriggers); }
    else note(r.message || 'Kaydedilemedi');
  };
  const test = async () => {
    setTesting(true);
    const r = await emailService.testSettings();
    setTesting(false);
    if (r.success) { setS((p) => (p ? { ...p, isVerified: true } : p)); note('SMTP bağlantısı doğrulandı ✓'); }
    else note(r.message || 'Bağlantı başarısız');
  };

  // Eşleştirme işlemleri
  const setTplFor = async (statusId: number, templateId: number | null) => {
    const r = await emailService.setTriggerTemplate(statusId, templateId);
    if (r.ok) emailService.listTriggers().then(setTriggers); else note(r.message || 'Kaydedilemedi');
  };
  const setActiveFor = async (statusId: number, active: boolean) => {
    const r = await emailService.setTriggerActive(statusId, active);
    if (r.ok) setTriggers((p) => p.map((t) => (t.orderStatusId === statusId ? { ...t, isActive: active } : t)));
    else note(r.message || 'İşlem başarısız');
  };

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-50 to-white">
      <div className="w-full px-5 sm:px-8 lg:px-10 py-8 max-w-[1000px]">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1">E-posta Bildirimleri</h1>
        <p className="text-slate-500 text-sm mb-6">Sipariş durumlarına göre otomatik e-posta gönderimini yapılandırın.</p>

        <Tabs defaultValue="templates">
          <TabsList>
            <TabsTrigger value="templates"><LayoutTemplate className="w-4 h-4" /> Şablonlar</TabsTrigger>
            <TabsTrigger value="triggers"><GitBranch className="w-4 h-4" /> Durum Eşleştirmeleri</TabsTrigger>
            <TabsTrigger value="settings"><Server className="w-4 h-4" /> Mail Ayarları</TabsTrigger>
          </TabsList>

          {/* Şablonlar */}
          <TabsContent value="templates">
            <div className="flex justify-end mb-3">
              <button onClick={() => setAddingTpl(true)} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-2xl text-sm font-semibold"><Plus className="w-4 h-4" /> Yeni Şablon</button>
            </div>
            {templates.length === 0 ? (
              <Card className="p-10 text-center"><div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 mx-auto mb-3 flex items-center justify-center"><LayoutTemplate className="w-7 h-7" /></div><h3 className="font-semibold text-slate-800">Henüz şablon yok</h3><p className="text-sm text-slate-500 mt-1">İlk e-posta şablonunu oluşturun.</p></Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {templates.map((t) => (
                  <Card key={t.id} className="p-4 flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center shrink-0"><Mail className="w-5 h-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 truncate">{t.name}</div>
                      <div className="text-xs text-slate-400 truncate">{t.subject}</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => setEditTpl(t)} className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"><Pencil className="w-4 h-4" /></button>
                      <button onClick={async () => { if (!confirm(`"${t.name}" silinsin mi?`)) return; const r = await emailService.deleteTemplate(t.id); if (r.ok) setTemplates((p) => p.filter((x) => x.id !== t.id)); else note(r.message || 'Silinemedi'); }} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Durum Eşleştirmeleri */}
          <TabsContent value="triggers">
            {!s?.isVerified && (
              <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Mail ayarları doğrulanmadan eşleştirmeler aktif edilemez.
              </div>
            )}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left"><tr><th className="px-4 py-3 font-medium">Sipariş Durumu</th><th className="px-4 py-3 font-medium">Şablon</th><th className="px-4 py-3 font-medium text-right">Aktif</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {triggers.map((t) => (
                      <tr key={t.orderStatusId} className="hover:bg-slate-50">
                        <td className="px-4 py-3"><span className="inline-flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ background: t.color || '#94a3b8' }} />{t.statusName}</span></td>
                        <td className="px-4 py-3">
                          <select value={t.templateId ?? ''} onChange={(e) => setTplFor(t.orderStatusId, e.target.value ? parseInt(e.target.value) : null)} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm">
                            <option value="">— Şablon yok —</option>
                            {templates.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3"><div className="flex justify-end"><Switch checked={t.isActive} disabled={!t.templateId || !s?.isVerified} onCheckedChange={(v) => setActiveFor(t.orderStatusId, v)} /></div></td>
                      </tr>
                    ))}
                    {triggers.length === 0 && <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Sipariş durumu bulunamadı.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Mail Ayarları */}
          <TabsContent value="settings">
            {!loaded ? <Card className="p-6"><p className="text-sm text-slate-400">Yükleniyor…</p></Card> : (
              <div className="space-y-5">
                <Card className="p-5 flex items-center gap-3">
                  {s?.isVerified
                    ? <><BadgeCheck className="w-6 h-6 text-emerald-500 shrink-0" /><div><div className="font-semibold text-slate-800 text-sm">SMTP doğrulandı</div><div className="text-xs text-slate-400">Durum eşleştirmeleri aktif edilebilir.</div></div></>
                    : <><AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" /><div><div className="font-semibold text-slate-800 text-sm">SMTP doğrulanmadı</div><div className="text-xs text-slate-400">Kaydedip “Bağlantıyı Test Et” ile doğrulayın. Doğrulanmadan e-posta gönderilmez.</div></div></>}
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-3"><Send className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-slate-800">Gönderim Hedefleri</h3></div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3"><div><div className="text-sm font-medium text-slate-800">Alıcıya gönder</div><div className="text-xs text-slate-400">Alıcı e-postası varsa gider.</div></div><Switch checked={f.sendToRecipient} onCheckedChange={(v) => set('sendToRecipient', v)} /></div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3"><div><div className="text-sm font-medium text-slate-800">Göndericiye gönder</div><div className="text-xs text-slate-400">Gönderici e-postası varsa gider.</div></div><Switch checked={f.sendToSender} onCheckedChange={(v) => set('sendToSender', v)} /></div>
                    <p className="text-[11px] text-slate-400">E-posta adresi olmayan taraf için bildirim tetiklenmez.</p>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4"><Mail className="w-5 h-5 text-indigo-600" /><h3 className="font-semibold text-slate-800">SMTP (Gönderim)</h3></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-slate-600">Gönderen Adı</label><input className={inputCls + ' mt-1'} value={f.fromName} onChange={(e) => set('fromName', e.target.value)} placeholder="ÇiçekGo" /></div>
                    <div><label className="text-xs font-medium text-slate-600">Gönderen E-posta</label><input className={inputCls + ' mt-1'} value={f.fromEmail} onChange={(e) => set('fromEmail', e.target.value)} placeholder="siparis@firma.com" /></div>
                    <div><label className="text-xs font-medium text-slate-600">SMTP Sunucu</label><input className={inputCls + ' mt-1'} value={f.smtpHost} onChange={(e) => set('smtpHost', e.target.value)} placeholder="smtp.firma.com" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className="text-xs font-medium text-slate-600">Port</label><input type="number" className={inputCls + ' mt-1'} value={f.smtpPort} onChange={(e) => set('smtpPort', parseInt(e.target.value) || 0)} /></div>
                      <div><label className="text-xs font-medium text-slate-600">Güvenlik</label><select className={inputCls + ' mt-1'} value={f.smtpSecurity} onChange={(e) => set('smtpSecurity', e.target.value)}><option value="StartTls">STARTTLS (587)</option><option value="Ssl">SSL/TLS (465)</option><option value="None">Yok (25)</option></select></div>
                    </div>
                    <div><label className="text-xs font-medium text-slate-600">Kullanıcı Adı</label><input className={inputCls + ' mt-1'} value={f.smtpUsername} onChange={(e) => set('smtpUsername', e.target.value)} /></div>
                    <div><label className="text-xs font-medium text-slate-600">Parola {s?.hasSmtpPassword && <span className="text-emerald-600">(tanımlı)</span>}</label><input type="password" className={inputCls + ' mt-1'} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder={s?.hasSmtpPassword ? '••••••• (değiştirmek için yazın)' : 'SMTP parolası'} autoComplete="new-password" /></div>
                    <div><label className="text-xs font-medium text-slate-600">Günlük Limit</label><input type="number" className={inputCls + ' mt-1'} value={f.dailyLimit} onChange={(e) => set('dailyLimit', parseInt(e.target.value) || 0)} /></div>
                  </div>
                </Card>

                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4"><Server className="w-5 h-5 text-slate-500" /><h3 className="font-semibold text-slate-800">IMAP / POP3 (opsiyonel)</h3></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium text-slate-600">IMAP Sunucu</label><input className={inputCls + ' mt-1'} value={f.imapHost || ''} onChange={(e) => set('imapHost', e.target.value)} /></div>
                    <div><label className="text-xs font-medium text-slate-600">IMAP Port</label><input type="number" className={inputCls + ' mt-1'} value={f.imapPort || 0} onChange={(e) => set('imapPort', parseInt(e.target.value) || 0)} /></div>
                    <div><label className="text-xs font-medium text-slate-600">IMAP Kullanıcı</label><input className={inputCls + ' mt-1'} value={f.imapUsername || ''} onChange={(e) => set('imapUsername', e.target.value)} /></div>
                    <div><label className="text-xs font-medium text-slate-600">IMAP Parola {s?.hasImapPassword && <span className="text-emerald-600">(tanımlı)</span>}</label><input type="password" className={inputCls + ' mt-1'} value={imapPwd} onChange={(e) => setImapPwd(e.target.value)} autoComplete="new-password" /></div>
                  </div>
                </Card>

                <div className="flex flex-wrap gap-2">
                  <button onClick={save} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl text-sm font-semibold disabled:opacity-50">{saving ? 'Kaydediliyor…' : 'Kaydet'}</button>
                  <button onClick={test} disabled={testing || !s?.configured} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-50">{testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}{testing ? 'Test ediliyor…' : 'Bağlantıyı Test Et & Doğrula'}</button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {(addingTpl || editTpl) && (
        <TemplateForm tpl={editTpl} tags={tags}
          onClose={() => { setAddingTpl(false); setEditTpl(null); }}
          onSaved={(m) => { setAddingTpl(false); setEditTpl(null); note(m); emailService.listTemplates().then(setTemplates); }} />
      )}
      {toast && <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl bg-slate-900 text-white text-sm font-medium">{toast}</div>}
    </div>
  );
}

function TemplateForm({ tpl, tags, onClose, onSaved }: { tpl: EmailTemplate | null; tags: MergeTag[]; onClose: () => void; onSaved: (m: string) => void }) {
  const isEdit = !!tpl;
  const [name, setName] = useState(tpl?.name || '');
  const [subject, setSubject] = useState(tpl?.subject || '');
  const [body, setBody] = useState(tpl?.htmlBody || '<div style="font-family:Arial,sans-serif;font-size:14px;color:#333">\n  <h2>Merhaba {{ recipient.name }},</h2>\n  <p>{{ company.name }} siparişiniz <b>{{ order.code }}</b> durumu: <b>{{ order.status }}</b>.</p>\n  <p>Toplam: {{ order.total }}</p>\n</div>');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const active = useRef<'subject' | 'body'>('body');
  useEscClose(onClose);

  const insert = (text: string) => {
    if (active.current === 'subject') {
      const el = subjectRef.current; const st = el?.selectionStart ?? subject.length; const en = el?.selectionEnd ?? subject.length;
      const next = subject.slice(0, st) + text + subject.slice(en); setSubject(next);
      requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(st + text.length, st + text.length); });
    } else {
      const el = bodyRef.current; const st = el?.selectionStart ?? body.length; const en = el?.selectionEnd ?? body.length;
      const next = body.slice(0, st) + text + body.slice(en); setBody(next);
      requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(st + text.length, st + text.length); });
    }
  };

  const doPreview = async () => { const r = await emailService.preview(subject, body); setPreview(r); };
  const save = async () => {
    setErr('');
    if (!name.trim()) return setErr('Şablon adı gerekli');
    if (!subject.trim()) return setErr('Konu gerekli');
    setBusy(true);
    const payload = { name: name.trim(), subject: subject.trim(), htmlBody: body, designJson: null, isActive: true };
    const r = isEdit && tpl ? await emailService.updateTemplate(tpl.id, payload) : await emailService.createTemplate(payload);
    if (r.ok) onSaved(isEdit ? 'Şablon güncellendi' : 'Şablon oluşturuldu'); else { setErr(r.message || 'Kaydedilemedi'); setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-4xl max-h-[92dvh] overflow-y-auto p-6 sm:p-7">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-bold">{isEdit ? 'Şablonu Düzenle' : 'Yeni Şablon'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          {/* Sol: düzenleyici */}
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-slate-600">Şablon Adı</label><input className={inputCls + ' mt-1'} value={name} onChange={(e) => setName(e.target.value)} placeholder="Sipariş Hazırlanıyor Şablonu" autoFocus /></div>
            <div><label className="text-xs font-medium text-slate-600">Konu</label><input ref={subjectRef} onFocus={() => (active.current = 'subject')} className={inputCls + ' mt-1'} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Siparişiniz {{ order.code }} {{ order.status }}" /></div>
            <div>
              <label className="text-xs font-medium text-slate-600">HTML İçerik</label>
              <textarea ref={bodyRef} onFocus={() => (active.current = 'body')} rows={12} className={inputCls + ' mt-1 font-mono text-xs'} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div>
              <div className="text-[11px] font-medium text-slate-500 mb-1">Değişkenler (tıkla → ekle)</div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <button key={t.code} onClick={() => insert(t.insert)} className="text-[11px] font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-full">{t.label}</button>
                ))}
              </div>
            </div>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </div>

          {/* Sağ: önizleme */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-slate-600">Önizleme (örnek veriyle)</span>
              <button onClick={doPreview} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-lg"><Eye className="w-3.5 h-3.5" /> Yenile</button>
            </div>
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-xs"><span className="text-slate-400">Konu:</span> <span className="font-medium text-slate-700">{preview?.subject || subject}</span></div>
              <iframe title="preview" className="w-full h-[360px] bg-white" srcDoc={preview?.html || body} />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">“Yenile” ile değişkenler örnek veriyle doldurulur.</p>
          </div>
        </div>

        <div className="flex gap-2 pt-4 mt-1 border-t border-slate-100">
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2.5 rounded-2xl font-medium text-slate-500 hover:bg-slate-100">İptal</button>
          <button onClick={save} disabled={busy} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">{busy ? 'Kaydediliyor…' : 'Kaydet'}</button>
        </div>
      </div>
    </div>
  );
}
