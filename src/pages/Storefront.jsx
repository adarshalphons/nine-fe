import React, { useState, useEffect, useRef } from "react";

const API_BASE =
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:8000";
const WS_BASE = API_BASE.replace(/^https/, "wss").replace(/^http/, "ws");
const POLL_INTERVAL_MS = 3000;

const PHASE = {
  IDLE: "idle",
  UPLOADING: "uploading",
  PROCESSING: "processing",
  DONE: "done",
  ERROR: "error",
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Storefront() {
  const [phase, setPhase] = useState(PHASE.IDLE);
  const [products, setProducts] = useState([]);
  const [tryonImages, setTryonImages] = useState({});
  const [flashCards, setFlashCards] = useState(new Set());
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const wsRef = useRef(null);
  const pollRef = useRef(null);
  const fileInputRef = useRef(null);
  const phaseRef = useRef(PHASE.IDLE);
  const seenRef = useRef(new Set());

  // Keep phaseRef in sync with rendered phase for use inside async closures
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Load product catalogue once on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => Array.isArray(data) && setProducts(data))
      .catch(() => {});
  }, []);

  // Auto-dismiss DONE banner after 3 s; keep retry button visible
  useEffect(() => {
    if (phase === PHASE.DONE) {
      const t = setTimeout(() => setPhase(PHASE.IDLE), 3000);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Cleanup connections on unmount
  useEffect(
    () => () => {
      _stopAll(wsRef, pollRef);
    },
    []
  );

  // ------------------------------------------------------------------
  // Internal helpers (plain functions — safe because all state writes
  // use functional updaters or refs, so stale-closure bugs are avoided)
  // ------------------------------------------------------------------

  const flashCard = (garmentId) => {
    setFlashCards((prev) => new Set(prev).add(garmentId));
    setTimeout(() => {
      setFlashCards((prev) => {
        const next = new Set(prev);
        next.delete(garmentId);
        return next;
      });
    }, 700);
  };

  const applyResult = (garmentId, resultUrl) => {
    if (seenRef.current.has(garmentId)) return;
    seenRef.current.add(garmentId);
    setTryonImages((prev) => ({ ...prev, [garmentId]: resultUrl }));
    setCompletedCount((prev) => prev + 1);
    flashCard(garmentId);
  };

  const handleComplete = () => {
    if (phaseRef.current !== PHASE.PROCESSING) return;
    _stopAll(wsRef, pollRef);
    setPhase(PHASE.DONE);
    setShowRetryButton(true);
  };

  const handleSessionError = () => {
    _stopAll(wsRef, pollRef);
    setTryonImages({});
    setPhase(PHASE.ERROR);
    setErrorMessage("Something went wrong. Please try again.");
    setShowRetryButton(false);
    setTimeout(() => {
      setPhase(PHASE.IDLE);
      setErrorMessage(null);
      setShowModal(true);
    }, 3000);
  };

  const startPolling = (sid) => {
    pollRef.current = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/tryon/${sid}/status`);
        if (!r.ok) return;
        const data = await r.json();
        (data.results || []).forEach((item) => {
          if (item.status === "complete" && item.result_url) {
            applyResult(item.garment_id, item.result_url);
          }
        });
        if (data.is_done) handleComplete();
      } catch (_) {}
    }, POLL_INTERVAL_MS);
  };

  const openWebSocket = (sid, garmentCount) => {
    const ws = new WebSocket(`${WS_BASE}/ws/${sid}`);
    wsRef.current = ws;
    let usedFallback = false;

    const fallback = () => {
      if (!usedFallback) {
        usedFallback = true;
        startPolling(sid, garmentCount);
      }
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "result" && msg.garment_id && msg.result_url) {
          applyResult(msg.garment_id, msg.result_url);
        } else if (msg.type === "complete") {
          handleComplete();
        } else if (msg.type === "error") {
          handleSessionError();
        }
      } catch (_) {}
    };
    ws.onerror = fallback;
    ws.onclose = () => {
      // Only fall back if we're still actively processing (not already done/error)
      if (phaseRef.current === PHASE.PROCESSING) fallback();
    };
  };

  const handleFileUpload = async (file) => {
    if (!file || !["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return;

    _stopAll(wsRef, pollRef);
    setPhase(PHASE.UPLOADING);
    setShowModal(false);
    setShowRetryButton(false);

    try {
      // Step 1 — upload body photo
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch(`${API_BASE}/upload_model`, { method: "POST", body: form });
      if (!uploadRes.ok) throw new Error("upload");
      const { model_key, cache_id } = await uploadRes.json();

      // Step 2 — start try-on batch for all displayed products
      const garments = products.map((p) => ({
        id: p.id,
        url: p.image_url,
        category: p.category,
        photo_type: "front",
      }));
      const tryonRes = await fetch(`${API_BASE}/start_tryon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_key, cache_id, garments }),
      });
      if (!tryonRes.ok) throw new Error("start_tryon");
      const { session_id, garment_count } = await tryonRes.json();

      // Reset per-session state
      seenRef.current = new Set();
      setTryonImages({});
      setFlashCards(new Set());
      setCompletedCount(0);
      setTotalCount(garment_count);
      setPhase(PHASE.PROCESSING);

      openWebSocket(session_id, garment_count);
    } catch (_) {
      handleSessionError();
    }
  };

  const resetSession = () => {
    _stopAll(wsRef, pollRef);
    setPhase(PHASE.IDLE);
    setTryonImages({});
    setCompletedCount(0);
    setTotalCount(0);
    setShowRetryButton(false);
    setErrorMessage(null);
    seenRef.current = new Set();
    setShowModal(true);
  };

  // ------------------------------------------------------------------
  // Render helpers
  // ------------------------------------------------------------------

  const isProcessing = phase === PHASE.PROCESSING;
  const isDone = phase === PHASE.DONE;
  const isError = phase === PHASE.ERROR;
  const showBanner = isProcessing || isDone || isError;

  let bannerText = "";
  if (isError) bannerText = errorMessage || "Something went wrong. Please try again.";
  else if (isDone) bannerText = "✨ Your personalized lookbook is ready!";
  else if (isProcessing)
    bannerText = `✨ Generating your personalized lookbook${
      totalCount > 0 && completedCount > 0 ? ` (${completedCount} of ${totalCount} ready)` : ""
    }...`;

  return (
    <div style={S.page}>
      <style>{CSS_ANIMATIONS}</style>

      {/* ── Header ── */}
      <header style={S.header}>
        <span style={S.logo}>Nine</span>
        {!showRetryButton && (
          <button style={S.uploadBtn} onClick={() => setShowModal(true)}>
            Try it on you
          </button>
        )}
      </header>

      {/* ── Progress banner ── */}
      {showBanner && (
        <div style={{ ...S.banner, ...(isError ? S.bannerError : S.bannerNormal) }}>
          {bannerText}
        </div>
      )}

      {/* ── Product grid ── */}
      <div style={S.gridWrapper}>
        {showRetryButton && (
          <div style={S.retryRow}>
            <button style={S.retryBtn} onClick={resetSession}>
              Try a different photo
            </button>
          </div>
        )}

        <div style={S.grid}>
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              resultUrl={tryonImages[p.id]}
              isLoading={isProcessing && !tryonImages[p.id]}
              isFlashing={flashCards.has(p.id)}
            />
          ))}
          {products.length === 0 && (
            <div style={S.empty}>
              <p style={{ color: "#9ca3af", margin: 0 }}>Loading products…</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Upload modal ── */}
      {showModal && (
        <UploadModal
          onClose={() => setShowModal(false)}
          onFile={handleFileUpload}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          fileInputRef={fileInputRef}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProductCard
// ---------------------------------------------------------------------------

function ProductCard({ product, resultUrl, isLoading, isFlashing }) {
  const src = resultUrl || product.image_url;

  return (
    <div style={S.card}>
      <div style={S.cardImgWrap}>
        <img
          src={src}
          alt={product.name}
          style={{
            ...S.cardImg,
            opacity: isLoading ? 0 : 1,
            animation: resultUrl ? "fadeIn 400ms ease both" : "none",
          }}
          onError={(e) => {
            e.target.src = product.image_url;
          }}
        />

        {isLoading && <div style={S.skeleton} className="shimmer" />}

        {isFlashing && (
          <div style={S.checkBadge} className="checkFlash" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="10" fill="#22c55e" />
              <path
                d="M5.5 10L8.5 13L14.5 7"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      <div style={S.cardInfo}>
        <p style={S.cardName}>{product.name}</p>
        <div style={S.priceRow}>
          {product.price != null && (
            <span style={S.price}>${product.price.toFixed(2)}</span>
          )}
          {product.original_price != null && (
            <span style={S.origPrice}>${product.original_price.toFixed(2)}</span>
          )}
          {product.is_new && <span style={S.newBadge}>NEW</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UploadModal
// ---------------------------------------------------------------------------

function UploadModal({ onClose, onFile, isDragging, setIsDragging, fileInputRef }) {
  const pick = (e) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  };
  const drop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  };

  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={(e) => e.stopPropagation()}>
        <button style={S.modalClose} onClick={onClose} aria-label="Close">
          ×
        </button>
        <h2 style={S.modalTitle}>Upload your photo</h2>
        <p style={S.modalSub}>See how every item looks on you</p>

        <div
          style={{
            ...S.dropzone,
            borderColor: isDragging ? "#6366f1" : "#d1d5db",
            background: isDragging ? "#f5f3ff" : "#fafafa",
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={drop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={S.dropIcon}>{isDragging ? "⬇️" : "📸"}</div>
          <p style={S.dropText}>
            {isDragging ? "Drop to upload" : "Drag & drop or click to choose"}
          </p>
          <p style={S.dropHint}>JPEG or PNG, up to 10 MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            style={{ display: "none" }}
            onChange={pick}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Pure utility — no React state, safe to call from async closures
// ---------------------------------------------------------------------------

function _stopAll(wsRef, pollRef) {
  if (pollRef.current) {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }
  if (wsRef.current) {
    wsRef.current.close();
    wsRef.current = null;
  }
}

// ---------------------------------------------------------------------------
// CSS keyframe animations (injected via <style> to avoid needing a CSS file)
// ---------------------------------------------------------------------------

const CSS_ANIMATIONS = `
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .shimmer {
    background-image: linear-gradient(
      90deg,
      #f0f0f0 25%,
      #e0e0e0 50%,
      #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s linear infinite;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes checkFlash {
    0%   { opacity: 1; transform: scale(0.6); }
    40%  { opacity: 1; transform: scale(1.2); }
    100% { opacity: 0; transform: scale(1);   }
  }
  .checkFlash {
    animation: checkFlash 700ms ease forwards;
  }
`;

// ---------------------------------------------------------------------------
// Styles (inline — matches repo convention; dark accents only where needed)
// ---------------------------------------------------------------------------

const S = {
  page: {
    minHeight: "100vh",
    background: "#fff",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: "#111",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    height: 56,
    borderBottom: "1px solid #f3f4f6",
    position: "sticky",
    top: 0,
    background: "#fff",
    zIndex: 20,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  uploadBtn: {
    padding: "9px 18px",
    background: "#111",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 0.2,
  },
  banner: {
    padding: "11px 24px",
    fontSize: 14,
    fontWeight: 500,
    position: "sticky",
    top: 56,
    zIndex: 19,
  },
  bannerNormal: {
    background: "#f0f9ff",
    borderBottom: "1px solid #bae6fd",
    color: "#0369a1",
  },
  bannerError: {
    background: "#fef2f2",
    borderBottom: "1px solid #fecaca",
    color: "#dc2626",
  },
  gridWrapper: {
    padding: "24px",
  },
  retryRow: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  retryBtn: {
    padding: "8px 16px",
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    color: "#374151",
    fontWeight: 500,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
    gap: 20,
  },
  card: {
    borderRadius: 12,
    overflow: "visible",
  },
  cardImgWrap: {
    position: "relative",
    aspectRatio: "2 / 3",
    borderRadius: 10,
    overflow: "hidden",
    background: "#f0f0f0",
  },
  cardImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },
  skeleton: {
    position: "absolute",
    inset: 0,
  },
  checkBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    lineHeight: 0,
  },
  cardInfo: {
    padding: "10px 2px 2px",
  },
  cardName: {
    fontSize: 13,
    fontWeight: 500,
    margin: "0 0 5px",
    lineHeight: 1.35,
    color: "#111",
  },
  priceRow: {
    display: "flex",
    alignItems: "center",
    gap: 7,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 13,
    color: "#374151",
  },
  origPrice: {
    fontSize: 12,
    color: "#9ca3af",
    textDecoration: "line-through",
  },
  newBadge: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.8,
    background: "#111",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: 4,
    lineHeight: "16px",
  },
  empty: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "80px 0",
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  modal: {
    background: "#fff",
    borderRadius: 16,
    padding: "32px 28px 28px",
    width: "90%",
    maxWidth: 420,
    position: "relative",
    boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  },
  modalClose: {
    position: "absolute",
    top: 10,
    right: 14,
    background: "none",
    border: "none",
    fontSize: 26,
    lineHeight: 1,
    cursor: "pointer",
    color: "#9ca3af",
    padding: 0,
  },
  modalTitle: {
    fontSize: 21,
    fontWeight: 700,
    margin: "0 0 6px",
    color: "#111",
  },
  modalSub: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 22px",
  },
  dropzone: {
    border: "2px dashed #d1d5db",
    borderRadius: 12,
    padding: "44px 24px",
    textAlign: "center",
    cursor: "pointer",
    transition: "border-color 150ms, background 150ms",
    userSelect: "none",
  },
  dropIcon: {
    fontSize: 36,
    marginBottom: 12,
    lineHeight: 1,
  },
  dropText: {
    fontSize: 14,
    fontWeight: 500,
    color: "#374151",
    margin: "0 0 5px",
  },
  dropHint: {
    fontSize: 12,
    color: "#9ca3af",
    margin: 0,
  },
};
