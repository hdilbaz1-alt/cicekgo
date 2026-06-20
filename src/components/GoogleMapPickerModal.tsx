'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { getApiUrl, getEndpoint } from '@/config/api';
import { useEscClose } from '@/lib/useEscClose';
import { MapPin, Search, X } from 'lucide-react';

export interface MapPickResult { provinceName: string; districtName: string; addressLine: string }

// useJsApiLoader: libraries referansı sabit olmalı (yeniden yükleme uyarısını önler)
const LIBRARIES: ('places')[] = ['places'];
const TR_CENTER = { lat: 39.925, lng: 32.866 }; // Ankara

const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

export default function GoogleMapPickerModal({ onClose, onPick }: { onClose: () => void; onPick: (r: MapPickResult) => void }) {
  useEscClose(onClose);
  const [apiKey, setApiKey] = useState<string | null | undefined>(undefined); // undefined=yükleniyor, null=yok

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(getApiUrl(getEndpoint('LOCATION_MAPS_KEY')), { headers: auth() });
        const b = await res.json();
        const key = b?.data;
        setApiKey(key && String(key).trim() ? String(key).trim() : null);
      } catch { setApiKey(null); }
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-5 h-5 text-indigo-600" /> Haritadan Konum Seç</h3>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {apiKey === undefined && <div className="p-10 text-center text-slate-400 text-sm">Harita yükleniyor…</div>}
        {apiKey === null && (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 mx-auto mb-3 flex items-center justify-center"><MapPin className="w-7 h-7" /></div>
            <h4 className="font-semibold text-slate-800">Google Maps anahtarı tanımlı değil</h4>
            <p className="text-sm text-slate-500 mt-1">Haritadan konum seçmek için platform yöneticisinin <b>Süperadmin → Ayarlar</b> bölümünden Google Maps API anahtarı girmesi gerekir.</p>
            <button onClick={onClose} className="mt-4 px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">Kapat</button>
          </div>
        )}
        {apiKey && <MapInner apiKey={apiKey} onPick={onPick} />}
      </div>
    </div>
  );
}

function parseGeocode(result: google.maps.GeocoderResult): MapPickResult {
  const get = (type: string) => result.address_components.find((c) => c.types.includes(type))?.long_name || '';
  let province = get('administrative_area_level_1');
  let district = get('administrative_area_level_2');
  if (!district) district = get('administrative_area_level_3');
  // Türkçe ekleri temizle
  province = province.replace(/\s*(Province|İli)$/i, '').trim();
  district = district.replace(/\s*(District|İlçesi)$/i, '').trim();

  const neighborhood = get('neighborhood') || get('sublocality') || get('sublocality_level_1');
  const route = get('route');
  const streetNo = get('street_number');
  const premise = get('premise');
  const lineParts = [neighborhood, route, streetNo, premise].filter(Boolean);
  const addressLine = lineParts.length ? lineParts.join(' ') : (result.formatted_address || '');
  return { provinceName: province, districtName: district, addressLine };
}

function MapInner({ apiKey, onPick }: { apiKey: string; onPick: (r: MapPickResult) => void }) {
  const { isLoaded, loadError } = useJsApiLoader({ id: 'cg-gmaps', googleMapsApiKey: apiKey, libraries: LIBRARIES });
  const [pos, setPos] = useState(TR_CENTER);
  const [zoom, setZoom] = useState(11);
  const [picked, setPicked] = useState<MapPickResult | null>(null);
  const [busy, setBusy] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  const reverse = useCallback((latLng: google.maps.LatLngLiteral) => {
    setBusy(true);
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: latLng, language: 'tr' }, (results, status) => {
      setBusy(false);
      if (status === 'OK' && results && results[0]) setPicked(parseGeocode(results[0]));
      else setPicked(null);
    });
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const ll = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setPos(ll); reverse(ll);
  }, [reverse]);

  const onPlaceChanged = useCallback(() => {
    const place = acRef.current?.getPlace();
    if (!place?.geometry?.location) return;
    const ll = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
    setPos(ll); setZoom(16);
    mapRef.current?.panTo(ll);
    mapRef.current?.setZoom(16);
    if (place.address_components) setPicked(parseGeocode(place as google.maps.GeocoderResult));
    else reverse(ll);
  }, [reverse]);

  // Açılışta kullanıcının konumunu iste; izin verilirse oraya merkezle (reddedilirse varsayılan konum kalır)
  useEffect(() => {
    if (!isLoaded || typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const ll = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPos(ll); setZoom(15); reverse(ll);
        mapRef.current?.panTo(ll); mapRef.current?.setZoom(15);
      },
      () => { /* izin yok / alınamadı → varsayılan konum */ },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [isLoaded, reverse]);

  if (loadError) return <div className="p-8 text-center text-sm text-red-600">Harita yüklenemedi. API anahtarını ve kısıtlamalarını kontrol edin.</div>;
  if (!isLoaded) return <div className="p-10 text-center text-slate-400 text-sm">Harita yükleniyor…</div>;

  return (
    <>
      <div className="p-3 border-b border-slate-100">
        <Autocomplete onLoad={(a) => { acRef.current = a; }} onPlaceChanged={onPlaceChanged}
          options={{ componentRestrictions: { country: 'tr' } }}>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input placeholder="Mahalle, cadde, bina ara…"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </Autocomplete>
      </div>

      <div className="flex-1 min-h-[300px]">
        <GoogleMap mapContainerStyle={{ width: '100%', height: '320px' }} center={pos} zoom={zoom}
          onLoad={(m) => { mapRef.current = m; }} onClick={onMapClick}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}>
          <Marker position={pos} draggable onDragEnd={(e) => { if (e.latLng) { const ll = { lat: e.latLng.lat(), lng: e.latLng.lng() }; setPos(ll); reverse(ll); } }} />
        </GoogleMap>
      </div>

      <div className="p-4 border-t border-slate-100">
        {busy && <p className="text-xs text-slate-400 mb-2">Adres çözümleniyor…</p>}
        {picked && (
          <div className="mb-3 text-sm">
            <div className="text-slate-700">{[picked.addressLine, [picked.districtName, picked.provinceName].filter(Boolean).join('/')].filter(Boolean).join(' ')}</div>
            {(!picked.provinceName || !picked.districtName) && <p className="text-[11px] text-amber-600 mt-1">İl/İlçe otomatik bulunamadı — formda elle seçebilirsiniz.</p>}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={() => picked && onPick(picked)} disabled={!picked}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-2xl font-semibold disabled:opacity-50">Bu konumu kullan</button>
        </div>
      </div>
    </>
  );
}
