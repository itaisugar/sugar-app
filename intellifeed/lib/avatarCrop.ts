// Circular avatar cropper. Web-only (this project runs on react-native-web), so
// it builds a self-contained DOM overlay appended to <body> — the same raw-DOM
// approach already used by the file picker in ./avatar.ts.
//
// Why this exists:
//  1. Lets the user choose exactly which circle of their photo becomes the
//     avatar (pan + zoom), instead of the app blindly center-cropping.
//  2. Re-encodes the chosen region through a <canvas> to a small, normalized
//     512x512 JPEG. This is what makes phone uploads work: photos taken on a
//     phone are frequently HEIC or 10MB+ — previously they were uploaded raw
//     with a ".jpg" name, so the browser/CDN couldn't render them and the
//     avatar "looked like it loaded" but never updated.

const OUTPUT_SIZE = 512; // px — stored avatar is a square; the app rounds it to a circle.
const MAX_ZOOM = 5;

const C = {
  backdrop: 'rgba(0,0,0,0.85)',
  surface: '#161319',
  text: '#F4F1EC',
  primary: '#E5484D',
  onPrimary: '#FFFFFF',
  border: 'rgba(255,255,255,0.12)',
};

// Load a File into an HTMLImageElement via an object URL. Rejects (rather than
// hanging) if the browser can't decode the format — e.g. an iPhone HEIC photo on
// a non-Safari browser — or if decoding stalls.
function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const fail = (msg: string) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      reject(new Error(msg));
    };
    const timer = setTimeout(
      () => fail('That photo took too long to open. Try a JPG or PNG.'),
      20000,
    );
    img.onload = () => {
      clearTimeout(timer);
      if (!img.naturalWidth || !img.naturalHeight) {
        return fail("That image couldn't be opened. Try a JPG or PNG photo.");
      }
      resolve({ img, url });
    };
    img.onerror = () =>
      fail("That image couldn't be opened. Try a JPG or PNG photo.");
    img.src = url;
  });
}

/**
 * Show a circular crop overlay for `file`. Resolves with a cropped 512x512 JPEG
 * File when the user confirms, or `null` if they cancel.
 */
export async function cropAvatar(file: File): Promise<File | null> {
  const { img, url } = await loadImage(file);

  return new Promise<File | null>((resolve) => {
    // Crop viewport (the visible square; its inscribed circle is the avatar).
    const vp = Math.min(window.innerWidth - 48, window.innerHeight - 220, 320);

    const coverScale = Math.max(vp / img.naturalWidth, vp / img.naturalHeight);
    let zoom = 1; // user zoom multiplier, >= 1
    let scale = coverScale * zoom;
    // Image top-left position relative to the viewport top-left.
    let tx = (vp - img.naturalWidth * scale) / 2;
    let ty = (vp - img.naturalHeight * scale) / 2;

    // ---- DOM ----------------------------------------------------------------
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      background: C.backdrop,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '20px',
      padding: '24px',
      boxSizing: 'border-box',
      // Stop the page from scrolling / pull-to-refresh while cropping.
      touchAction: 'none',
      userSelect: 'none',
      WebkitUserSelect: 'none',
    } as Partial<CSSStyleDeclaration>);

    const title = document.createElement('div');
    title.textContent = 'Drag to position · pinch or scroll to zoom';
    Object.assign(title.style, {
      color: C.text,
      font: "500 14px -apple-system, system-ui, sans-serif",
      textAlign: 'center',
      opacity: '0.9',
    } as Partial<CSSStyleDeclaration>);

    // Frame holds the image; a circular ring overlay sits on top.
    const frame = document.createElement('div');
    Object.assign(frame.style, {
      position: 'relative',
      width: `${vp}px`,
      height: `${vp}px`,
      overflow: 'hidden',
      borderRadius: '12px',
      background: '#000',
      touchAction: 'none',
      cursor: 'grab',
    } as Partial<CSSStyleDeclaration>);

    const imgEl = document.createElement('img');
    imgEl.src = url;
    imgEl.draggable = false;
    Object.assign(imgEl.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      transformOrigin: '0 0',
      pointerEvents: 'none',
    } as Partial<CSSStyleDeclaration>);

    // Circular mask: a centered circle that darkens everything outside it
    // (via a huge box-shadow) and outlines the exact avatar boundary.
    const circle = document.createElement('div');
    Object.assign(circle.style, {
      position: 'absolute',
      inset: '0',
      borderRadius: '50%',
      boxShadow: `0 0 0 9999px ${C.backdrop}`,
      border: `2px solid rgba(255,255,255,0.85)`,
      pointerEvents: 'none',
      boxSizing: 'border-box',
    } as Partial<CSSStyleDeclaration>);

    frame.appendChild(imgEl);
    frame.appendChild(circle);

    const buttons = document.createElement('div');
    Object.assign(buttons.style, {
      display: 'flex',
      gap: '12px',
      width: `${vp}px`,
    } as Partial<CSSStyleDeclaration>);

    const mkBtn = (label: string, primary: boolean) => {
      const b = document.createElement('button');
      b.textContent = label;
      Object.assign(b.style, {
        flex: '1',
        padding: '14px',
        borderRadius: '12px',
        border: primary ? 'none' : `1px solid ${C.border}`,
        background: primary ? C.primary : 'transparent',
        color: primary ? C.onPrimary : C.text,
        font: "600 15px -apple-system, system-ui, sans-serif",
        cursor: 'pointer',
      } as Partial<CSSStyleDeclaration>);
      return b;
    };
    const cancelBtn = mkBtn('Cancel', false);
    const useBtn = mkBtn('Use photo', true);
    buttons.appendChild(cancelBtn);
    buttons.appendChild(useBtn);

    overlay.appendChild(title);
    overlay.appendChild(frame);
    overlay.appendChild(buttons);
    document.body.appendChild(overlay);

    // ---- transform helpers --------------------------------------------------
    const clampPan = () => {
      const dw = img.naturalWidth * scale;
      const dh = img.naturalHeight * scale;
      // Image must always cover the viewport.
      tx = Math.min(0, Math.max(vp - dw, tx));
      ty = Math.min(0, Math.max(vp - dh, ty));
    };
    const render = () => {
      clampPan();
      imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    };
    // Zoom around a focal point (fx, fy) given in viewport coords.
    const applyZoom = (nextZoom: number, fx: number, fy: number) => {
      nextZoom = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
      const newScale = coverScale * nextZoom;
      // Keep the focal point anchored to the same image pixel.
      tx = fx - ((fx - tx) * newScale) / scale;
      ty = fy - ((fy - ty) * newScale) / scale;
      zoom = nextZoom;
      scale = newScale;
      render();
    };

    render();

    // ---- pointer (mouse + touch unified) ------------------------------------
    const pointers = new Map<number, { x: number; y: number }>();
    let pinchStartDist = 0;
    let pinchStartZoom = 1;

    const localXY = (e: PointerEvent) => {
      const r = frame.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const onPointerDown = (e: PointerEvent) => {
      frame.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, localXY(e));
      frame.style.cursor = 'grabbing';
      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        pinchStartZoom = zoom;
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId)!;
      const cur = localXY(e);
      pointers.set(e.pointerId, cur);

      if (pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
        if (pinchStartDist > 0) {
          applyZoom((dist / pinchStartDist) * pinchStartZoom, mid.x, mid.y);
        }
      } else {
        tx += cur.x - prev.x;
        ty += cur.y - prev.y;
        render();
      }
    };
    const onPointerUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (pointers.size === 0) frame.style.cursor = 'grab';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x, y } = (() => {
        const r = frame.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
      })();
      applyZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), x, y);
    };

    frame.addEventListener('pointerdown', onPointerDown);
    frame.addEventListener('pointermove', onPointerMove);
    frame.addEventListener('pointerup', onPointerUp);
    frame.addEventListener('pointercancel', onPointerUp);
    frame.addEventListener('wheel', onWheel, { passive: false });

    // ---- finish -------------------------------------------------------------
    const cleanup = () => {
      URL.revokeObjectURL(url);
      overlay.remove();
    };
    const finish = (result: File | null) => {
      cleanup();
      resolve(result);
    };

    cancelBtn.addEventListener('click', () => finish(null));

    useBtn.addEventListener('click', () => {
      clampPan();
      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d')!;
      // Source rect (in natural image px) that maps to the viewport square.
      const sx = -tx / scale;
      const sy = -ty / scale;
      const sSize = vp / scale;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
      canvas.toBlob(
        (blob) => {
          if (!blob) return finish(null);
          finish(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.9,
      );
    });
  });
}
