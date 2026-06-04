// documents.js — хранилище документов (права, техпаспорт, техосмотр)
// Каждый документ: лицевая + обратная стороны, просмотр/зум
(() => {
  'use strict';
  window.DX = window.DX || {};
  const DX = window.DX;
  const html   = DX.html;
  const { useState, useCallback, useRef } = DX;
  const Icon      = function(p){ return DX.Icon ? DX.Icon(p) : null; };
  const alphaBg   = function(){ return DX.alphaBg ? DX.alphaBg(...arguments) : arguments[0]; };
  function useToast(){ return DX.useToast ? DX.useToast() : { push: function(){} }; }
  const SimplePage = function(p){ var F = DX.SimplePage; return F ? F(p) : (p.children || null); };

  // ── Лайтбокс (полноэкранный просмотр фото) ───────────────────────
  function LightBox({ url, onClose }) {
    if (!url) return null;
    return html`
      <div
        onClick=${onClose}
        style=${{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '16px'
        }}
      >
        <button
          onClick=${onClose}
          style=${{
            position: 'absolute', top: '16px', right: '16px',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', borderRadius: '50%',
            width: '40px', height: '40px', fontSize: '20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >✕</button>
        <img
          src=${url}
          onClick=${(e) => e.stopPropagation()}
          style=${{
            maxWidth: '100%', maxHeight: '90vh',
            borderRadius: '12px', display: 'block',
            boxShadow: '0 8px 40px rgba(0,0,0,0.6)'
          }}
        />
      </div>
    `;
  }

  // ── Загрузка одного фото ──────────────────────────────────────────
  // Стратегия: сначала пробуем Supabase Storage (HTTPS URL для sync),
  // если не удалось — создаём data URL (локальный fallback)
  async function uploadDocPage(file, session, storagePath) {
    // Шаг 1: Supabase Storage (если есть сессия) — HTTPS URL синкается на все устройства
    const client = DX.getSupabaseClient ? DX.getSupabaseClient() : null;
    if (client && session && session.authenticated && session.id) {
      try {
        const ext = (file.name || 'photo').split('.').pop().toLowerCase() || 'jpg';
        const safeExt = ['jpg','jpeg','png','webp','gif'].includes(ext) ? ext : 'jpg';
        const filePath = `${session.id}/${storagePath}/${Date.now()}.${safeExt}`;
        const cfg = window.DRIVEX_SUPABASE_CONFIG || {};
        const bucket = (cfg.buckets && cfg.buckets.documents) || 'documents';

        const { error: uploadError } = await client.storage
          .from(bucket)
          .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

        if (!uploadError) {
          // Бакет PUBLIC — доверяем URL без HEAD-проверки (HEAD может падать из-за CORS)
          const { data: urlData } = client.storage.from(bucket).getPublicUrl(filePath);
          if (urlData && urlData.publicUrl) {
            return urlData.publicUrl; // ✅ HTTPS URL из Supabase Storage
          }
        }
      } catch {}
    }

    // Шаг 2: Fallback — data URL (только локально, не синкается)
    if (DX.prepareDocumentDataUrl) {
      try {
        const dataUrl = await DX.prepareDocumentDataUrl(file, { maxSize: 1200, quality: 0.82 });
        if (dataUrl) return dataUrl;
      } catch {}
    }

    // Финальный fallback: читаем файл как base64
    try {
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target && e.target.result ? e.target.result : null);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    } catch {}

    return null;
  }

  // ── Слот документа (лицевая / обратная) ──────────────────────────
  function DocPageSlot({ label, color, page, onAdd, onRemove, onView, busy }) {
    const hasPic = Boolean(page && page.image);
    const [imgError, setImgError] = useState(false);

    // Сбрасываем ошибку когда меняется фото
    const imgRef = useRef(null);
    const prevSrc = useRef('');
    if (page && page.image !== prevSrc.current) {
      prevSrc.current = page ? page.image : '';
      if (imgError) setImgError(false);
    }

    const imgLoaded = hasPic && !imgError;

    return html`
      <div className="glass-card-light rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style=${{ background: alphaBg(color, 0.2), color }}
            >
              ${label === 'Лицевая сторона'
                ? html`<${Icon} name="user" size=${16} />`
                : html`<${Icon} name="copy" size=${16} />`}
            </div>
            <span className="font-semibold text-sm" style=${{ color: 'var(--drivex-white)' }}>
              ${label}
            </span>
          </div>
          <span
            className="px-2 py-1 rounded-lg text-xs font-bold"
            style=${{
              background: hasPic ? alphaBg(color, 0.18) : 'rgba(148,163,184,0.12)',
              color: hasPic ? color : 'var(--drivex-silver)'
            }}
          >
            ${hasPic ? '✓ Добавлено' : 'Нет фото'}
          </span>
        </div>

        ${hasPic
          ? html`
              <div
                className="px-4 pb-3"
                style=${{ cursor: imgLoaded ? 'pointer' : 'default' }}
                onClick=${imgLoaded ? onView : undefined}
              >
                ${imgLoaded
                  ? html`
                      <div style=${{ position: 'relative' }}>
                        <img
                          src=${page.image}
                          alt=""
                          onError=${() => setImgError(true)}
                          style=${{
                            width: '100%', borderRadius: '12px', display: 'block',
                            maxHeight: '200px', objectFit: 'cover',
                            border: '2px solid rgba(255,255,255,0.08)'
                          }}
                        />
                        <div style=${{
                          position: 'absolute', bottom: '8px', right: '8px',
                          background: 'rgba(0,0,0,0.6)', borderRadius: '8px',
                          padding: '4px 10px', color: '#fff', fontSize: '11px',
                          display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                          🔍 Просмотр
                        </div>
                      </div>
                    `
                  : html`
                      <div
                        className="rounded-2xl flex items-center justify-center"
                        style=${{ height: '100px', background: 'rgba(245,158,11,0.08)', border: '2px dashed rgba(245,158,11,0.3)' }}
                      >
                        <div className="text-center">
                          <div style=${{ fontSize: '24px', marginBottom: '4px' }}>⚠️</div>
                          <p className="text-xs" style=${{ color: 'var(--drivex-warning)' }}>
                            Фото не загрузилось
                          </p>
                          <p className="text-xs mt-1" style=${{ color: 'var(--drivex-silver)' }}>
                            Нажмите «Заменить» чтобы добавить снова
                          </p>
                        </div>
                      </div>
                    `}
              </div>
            `
          : html`
              <div
                className="mx-4 mb-3 rounded-2xl flex items-center justify-center"
                style=${{ height: '110px', background: 'rgba(148,163,184,0.06)', border: '2px dashed rgba(148,163,184,0.2)' }}
              >
                <div className="text-center">
                  <div style=${{ color: 'var(--drivex-silver)', marginBottom: '6px', fontSize: '28px' }}>📷</div>
                  <p className="text-xs" style=${{ color: 'var(--drivex-silver)' }}>Фото не добавлено</p>
                </div>
              </div>
            `}

        <div className="px-4 pb-4 flex gap-2">
          <button
            type="button"
            className="flex-1 py-3 rounded-2xl font-bold text-sm dx-btn"
            onClick=${onAdd}
            disabled=${busy}
            style=${{ opacity: busy ? 0.6 : 1 }}
          >
            ${busy ? 'Загрузка...' : hasPic ? 'Заменить' : 'Добавить фото'}
          </button>
          ${hasPic
            ? html`
                <button
                  type="button"
                  className="px-3 py-3 rounded-2xl text-sm font-bold"
                  style=${{ background: alphaBg(color, 0.14), color }}
                  onClick=${onView}
                  disabled=${busy}
                  title="Просмотр"
                >
                  🔍
                </button>
                <button
                  type="button"
                  className="px-3 py-3 rounded-2xl text-sm font-bold"
                  style=${{ background: 'rgba(239,68,68,0.15)', color: 'var(--drivex-danger)' }}
                  onClick=${onRemove}
                  disabled=${busy}
                  title="Удалить"
                >
                  🗑
                </button>
              `
            : null}
        </div>
      </div>
    `;
  }

  // ── Экран Права ───────────────────────────────────────────────────
  function LicenseDocumentScreen({ document, onSave, onRemove, authStatus, buyerSession }) {
    const toast = useToast();
    const frontInputRef = useRef(null);
    const backInputRef  = useRef(null);
    const [busy, setBusy]       = useState('');
    const [lightbox, setLightbox] = useState('');

    // Сессия для загрузки в Storage
    const session = (buyerSession && buyerSession.authenticated && buyerSession.provider === 'supabase')
      ? buyerSession
      : null;

    // Нормализуем document → {front, back}
    const sided     = DX.normalizeSidedDoc ? DX.normalizeSidedDoc(document, 'Права') : null;
    const frontPage = sided ? sided.front : null;
    const backPage  = sided ? sided.back  : null;
    const totalCount = (frontPage ? 1 : 0) + (backPage ? 1 : 0);

    const handleAdd = useCallback(async (side, e) => {
      const file = e && e.target && e.target.files && e.target.files[0];
      if (e && e.target) e.target.value = '';
      if (!file) return;

      setBusy(side);
      try {
        const url = await uploadDocPage(file, session, `license/${side}`);
        if (!url) { toast.push('Не удалось загрузить фото'); setBusy(''); return; }

        onSave && onSave(side, {
          id: DX.genId ? DX.genId('lic') : ('lic-' + Date.now()),
          name: side === 'front' ? 'Права (лицевая)' : 'Права (обратная)',
          image: url, addedAt: Date.now()
        });
        toast.push(side === 'front' ? '✓ Лицевая сторона сохранена' : '✓ Обратная сторона сохранена');
      } catch {
        toast.push('Ошибка загрузки');
      }
      setBusy('');
    }, [onSave, session, toast]);

    return html`
      <${SimplePage} title="Права" backPath="/documents">
        <div className="px-6 py-6 space-y-4">

          <div className="glass-card rounded-3xl p-5 neon-glow-cyan">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: 'rgba(6,182,212,0.2)', color: 'var(--drivex-neon-cyan)' }}>
                <${Icon} name="user" size=${26} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg" style=${{ color: 'var(--drivex-white)' }}>
                  Водительское удостоверение
                </p>
                <p className="text-sm mt-1" style=${{ color: 'var(--drivex-silver)' }}>
                  Добавьте обе стороны для полного хранилища
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl text-sm font-bold" style=${{
                background: totalCount === 2 ? 'rgba(16,185,129,0.2)' : totalCount === 1 ? 'rgba(245,158,11,0.2)' : 'rgba(148,163,184,0.12)',
                color: totalCount === 2 ? 'var(--drivex-success)' : totalCount === 1 ? 'var(--drivex-warning)' : 'var(--drivex-silver)'
              }}>
                ${totalCount}/2
              </span>
            </div>
          </div>

          <${DocPageSlot}
            label="Лицевая сторона"
            color="var(--drivex-neon-cyan)"
            page=${frontPage}
            busy=${busy === 'front'}
            onAdd=${() => frontInputRef.current && frontInputRef.current.click()}
            onRemove=${() => { onRemove && onRemove('front'); toast.push('Лицевая сторона удалена'); }}
            onView=${() => frontPage && setLightbox(frontPage.image)}
          />
          <input ref=${frontInputRef} type="file" accept="image/*" style=${{ display:'none' }}
            onChange=${(e) => handleAdd('front', e)} />

          <${DocPageSlot}
            label="Обратная сторона"
            color="var(--drivex-electric-blue)"
            page=${backPage}
            busy=${busy === 'back'}
            onAdd=${() => backInputRef.current && backInputRef.current.click()}
            onRemove=${() => { onRemove && onRemove('back'); toast.push('Обратная сторона удалена'); }}
            onView=${() => backPage && setLightbox(backPage.image)}
          />
          <input ref=${backInputRef} type="file" accept="image/*" style=${{ display:'none' }}
            onChange=${(e) => handleAdd('back', e)} />

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: 'var(--drivex-silver)' }}>
              ${session
                ? 'Фото загружается в защищённое облако вашего аккаунта.'
                : 'Фото сохраняется на этом устройстве. Войдите в аккаунт для облачного хранения.'}
            </p>
          </div>
        </div>
        <${LightBox} url=${lightbox} onClose=${() => setLightbox('')} />
      </${SimplePage}>
    `;
  }

  // ── Экран Документы машины ────────────────────────────────────────
  function CarDocumentsScreen({ carId, documents, onSaveDocument, onRemoveDocument, onSelectCar, authStatus, buyerSession }) {
    const toast = useToast();
    const car   = DX.findGarageCar ? DX.findGarageCar(carId) : null;
    const docs  = documents && typeof documents === 'object' ? documents : {};
    const carDocs = car && docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};

    const inputRefs   = useRef({});
    const [busyKey, setBusyKey]     = useState('');
    const [lightbox, setLightbox]   = useState('');

    const session = (buyerSession && buyerSession.authenticated && buyerSession.provider === 'supabase')
      ? buyerSession : null;

    if (!car) return html`
      <${SimplePage} title="Машина не найдена" backPath="/documents">
        <div className="px-6 py-6">
          <div className="glass-card-light rounded-2xl p-5" style=${{ color: 'var(--drivex-white)' }}>
            Попробуйте открыть документы другой машины.
          </div>
        </div>
      </${SimplePage}>
    `;

    const handleAdd = useCallback(async (kind, side, e) => {
      const file = e && e.target && e.target.files && e.target.files[0];
      if (e && e.target) e.target.value = '';
      if (!file) return;

      const key = `${kind}-${side}`;
      setBusyKey(key);
      try {
        const url = await uploadDocPage(file, session, `${car.id}/${kind}/${side}`);
        if (!url) { toast.push('Не удалось загрузить фото'); setBusyKey(''); return; }

        const kindLabel = kind === 'registration' ? 'Техпаспорт' : 'Техосмотр';
        const sideLabel = side === 'front' ? ' (лицевая)' : ' (обратная)';
        onSaveDocument && onSaveDocument(car.id, kind, side, {
          id: DX.genId ? DX.genId('vdoc') : ('vdoc-' + Date.now()),
          name: kindLabel + sideLabel,
          image: url, addedAt: Date.now()
        });
        toast.push('✓ ' + kindLabel + sideLabel + ' сохранена');
      } catch {
        toast.push('Ошибка загрузки');
      }
      setBusyKey('');
    }, [car.id, onSaveDocument, session, toast]);

    const vehicleDocumentKinds = DX.vehicleDocumentKinds || [
      { id: 'registration', title: 'Техпаспорт', subtitle: 'Свидетельство о регистрации', color: 'var(--drivex-electric-blue)' },
      { id: 'inspection',   title: 'Техосмотр',  subtitle: 'Диагностическая карта',       color: 'var(--drivex-warning)' }
    ];

    return html`
      <${SimplePage} title=${car.name} backPath="/documents">
        <div className="px-6 py-6 space-y-5">

          <div className="glass-card rounded-3xl p-5 neon-glow-blue">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style=${{ background: 'rgba(14,165,233,0.2)', color: 'var(--drivex-electric-blue)' }}>
                <${Icon} name="car" size=${26} />
              </div>
              <div>
                <p className="font-bold text-lg" style=${{ color: 'var(--drivex-white)' }}>${car.name}</p>
                <p className="text-sm mt-1" style=${{ color: 'var(--drivex-silver)' }}>
                  ${[car.plate, car.year, car.mileage].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>
          </div>

          ${vehicleDocumentKinds.map((kind) => {
            const sided     = DX.normalizeSidedDoc ? DX.normalizeSidedDoc(carDocs[kind.id], kind.title) : null;
            const frontPage = sided ? sided.front : null;
            const backPage  = sided ? sided.back  : null;
            const docCount  = (frontPage ? 1 : 0) + (backPage ? 1 : 0);

            return html`
              <div key=${kind.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-bold" style=${{ color: 'var(--drivex-white)' }}>${kind.title}</p>
                    <p className="text-xs" style=${{ color: 'var(--drivex-silver)' }}>${kind.subtitle}</p>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-sm font-bold" style=${{
                    background: docCount === 2 ? alphaBg(kind.color, 0.18) : docCount === 1 ? 'rgba(245,158,11,0.18)' : 'rgba(148,163,184,0.12)',
                    color: docCount === 2 ? kind.color : docCount === 1 ? 'var(--drivex-warning)' : 'var(--drivex-silver)'
                  }}>
                    ${docCount}/2
                  </span>
                </div>

                <div className="space-y-3">
                  <${DocPageSlot}
                    label="Лицевая сторона"
                    color=${kind.color}
                    page=${frontPage}
                    busy=${busyKey === `${kind.id}-front`}
                    onAdd=${() => { const r = inputRefs.current[`${kind.id}-front`]; r && r.click(); }}
                    onRemove=${() => { onRemoveDocument && onRemoveDocument(car.id, kind.id, 'front'); toast.push(kind.title + ' (лицевая) удалена'); }}
                    onView=${() => frontPage && setLightbox(frontPage.image)}
                  />
                  <input ref=${(n)=>{ inputRefs.current[`${kind.id}-front`]=n; }} type="file" accept="image/*"
                    style=${{ display:'none' }} onChange=${(e)=>handleAdd(kind.id,'front',e)} />

                  <${DocPageSlot}
                    label="Обратная сторона"
                    color=${kind.color}
                    page=${backPage}
                    busy=${busyKey === `${kind.id}-back`}
                    onAdd=${() => { const r = inputRefs.current[`${kind.id}-back`]; r && r.click(); }}
                    onRemove=${() => { onRemoveDocument && onRemoveDocument(car.id, kind.id, 'back'); toast.push(kind.title + ' (обратная) удалена'); }}
                    onView=${() => backPage && setLightbox(backPage.image)}
                  />
                  <input ref=${(n)=>{ inputRefs.current[`${kind.id}-back`]=n; }} type="file" accept="image/*"
                    style=${{ display:'none' }} onChange=${(e)=>handleAdd(kind.id,'back',e)} />
                </div>
              </div>
            `;
          })}

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: 'var(--drivex-silver)' }}>
              Каждый документ: 2 стороны. Итого для этой машины: 4 фото.
            </p>
          </div>
        </div>
        <${LightBox} url=${lightbox} onClose=${() => setLightbox('')} />
      </${SimplePage}>
    `;
  }

  // ── Хранилище (список) ─────────────────────────────────────────────
  function DocumentsVaultScreen({ documents, totalCount, authStatus, garageCars: propCars }) {
    const docs      = documents && typeof documents === 'object' ? documents : {};
    const safeTotal = Number.isFinite(Number(totalCount)) ? Number(totalCount) : 0;
    const cloudEnabled = authStatus && authStatus.mode === 'supabase';

    // Реактивный список машин: из пропа (приоритет) или DX
    const cars = Array.isArray(propCars) ? propCars : (DX.garageCars || []);

    const licCount = DX.getSidedDocCount ? DX.getSidedDocCount(docs.license) : (docs.license ? 1 : 0);

    return html`
      <${SimplePage} title="Документы" backPath="/profile">
        <div className="px-6 py-6 space-y-4">

          <div className="glass-card rounded-3xl p-6 neon-glow-cyan">
            <p className="text-sm" style=${{ color: 'var(--drivex-silver)' }}>Хранилище документов</p>
            <p className="text-4xl font-bold mt-2" style=${{ color: 'var(--drivex-white)' }}>${safeTotal}</p>
            <p className="text-xs mt-1" style=${{ color: 'var(--drivex-silver)' }}>
              ${cloudEnabled ? 'Облако — доступно на всех устройствах' : 'Локально на этом устройстве'}
              ${' • '}Каждый документ: 2 стороны
            </p>
          </div>

          <!-- Права -->
          <a href="#/documents/license"
            className="glass-card-light rounded-2xl p-5 flex items-center gap-4 transition-all hover:scale-[1.01]"
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style=${{ background: 'rgba(6,182,212,0.2)', color: 'var(--drivex-neon-cyan)' }}>
              <${Icon} name="user" size=${22} />
            </div>
            <div className="flex-1">
              <p className="font-bold" style=${{ color: 'var(--drivex-white)' }}>Водительское удостоверение</p>
              <p className="text-sm mt-1" style=${{ color: 'var(--drivex-silver)' }}>Лицевая и обратная стороны</p>
            </div>
            <span className="px-3 py-1 rounded-xl text-xs font-bold" style=${{
              background: licCount === 2 ? 'rgba(16,185,129,0.18)' : licCount === 1 ? 'rgba(245,158,11,0.18)' : 'rgba(148,163,184,0.12)',
              color: licCount === 2 ? 'var(--drivex-success)' : licCount === 1 ? 'var(--drivex-warning)' : 'var(--drivex-silver)'
            }}>
              ${licCount}/2
            </span>
          </a>

          <!-- По автомобилям -->
          <div>
            <h2 className="text-xl font-bold mb-3" style=${{ color: 'var(--drivex-white)' }}>
              По автомобилям
            </h2>
            <div className="space-y-3">
              ${cars.map((car) => {
                const carDocs   = docs.cars && docs.cars[car.id] ? docs.cars[car.id] : {};
                const regCount  = DX.getSidedDocCount ? DX.getSidedDocCount(carDocs.registration) : (carDocs.registration ? 1 : 0);
                const insCount  = DX.getSidedDocCount ? DX.getSidedDocCount(carDocs.inspection)   : (carDocs.inspection   ? 1 : 0);
                const total4    = regCount + insCount;

                return html`
                  <a key=${car.id} href=${`#/documents/car/${car.id}`}
                    className="glass-card-light rounded-2xl p-4 block transition-all hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style=${{ background: 'rgba(14,165,233,0.2)', color: 'var(--drivex-electric-blue)' }}>
                        <${Icon} name="car" size=${22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold" style=${{ color: 'var(--drivex-white)' }}>${car.name}</p>
                        <p className="text-sm mt-1" style=${{ color: 'var(--drivex-silver)' }}>
                          ${[car.plate, car.year].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-xl text-xs font-bold" style=${{
                        background: total4 === 4 ? 'rgba(16,185,129,0.18)' : total4 > 0 ? 'rgba(245,158,11,0.18)' : 'rgba(14,165,233,0.16)',
                        color: total4 === 4 ? 'var(--drivex-success)' : total4 > 0 ? 'var(--drivex-warning)' : 'var(--drivex-electric-blue)'
                      }}>
                        ${total4}/4
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2 flex-wrap">
                      <span className="px-3 py-1 rounded-xl text-xs font-bold" style=${{
                        background: regCount === 2 ? 'rgba(14,165,233,0.14)' : regCount === 1 ? 'rgba(245,158,11,0.14)' : 'rgba(148,163,184,0.1)',
                        color: regCount === 2 ? 'var(--drivex-electric-blue)' : regCount > 0 ? 'var(--drivex-warning)' : 'var(--drivex-silver)'
                      }}>
                        Техпаспорт ${regCount}/2
                      </span>
                      <span className="px-3 py-1 rounded-xl text-xs font-bold" style=${{
                        background: insCount === 2 ? 'rgba(245,158,11,0.14)' : insCount === 1 ? 'rgba(245,158,11,0.14)' : 'rgba(148,163,184,0.1)',
                        color: insCount > 0 ? 'var(--drivex-warning)' : 'var(--drivex-silver)'
                      }}>
                        Техосмотр ${insCount}/2
                      </span>
                    </div>
                  </a>
                `;
              })}

              ${cars.length === 0
                ? html`
                    <a href="#/garage"
                      className="glass-card-light rounded-2xl p-5 flex items-center gap-4"
                    >
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style=${{ background: 'rgba(14,165,233,0.1)', color: 'var(--drivex-silver)' }}>
                        <${Icon} name="car" size=${22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold" style=${{ color: 'var(--drivex-white)' }}>Добавьте автомобиль</p>
                        <p className="text-sm mt-1" style=${{ color: 'var(--drivex-silver)' }}>
                          Чтобы хранить техпаспорт и техосмотр
                        </p>
                      </div>
                      <span style=${{ color: 'var(--drivex-silver)', fontSize: '20px' }}>›</span>
                    </a>
                  `
                : null}
            </div>
          </div>

          <div className="glass-card-light rounded-2xl p-4">
            <p className="text-xs" style=${{ color: 'var(--drivex-silver)' }}>
              ${cloudEnabled
                ? 'Документы привязаны к аккаунту и доступны на всех устройствах.'
                : 'Документы хранятся локально. При очистке браузера нужно добавить заново.'}
            </p>
          </div>
        </div>
      </${SimplePage}>
    `;
  }

  // ── Экспорт ────────────────────────────────────────────────────────
  DX.screens = DX.screens || {};
  DX.screens.DocumentsVaultScreen  = DocumentsVaultScreen;
  DX.screens.LicenseDocumentScreen = LicenseDocumentScreen;
  DX.screens.CarDocumentsScreen    = CarDocumentsScreen;
})();
