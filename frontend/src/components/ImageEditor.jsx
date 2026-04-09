import { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const ASPECT_RATIOS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: undefined },
]

/* ── tiny SVG icons ── */
const RotateLeftIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 2v6h6" /><path d="M2.66 15.57a10 10 0 1 0 .57-8.38" />
  </svg>
)
const RotateRightIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6" /><path d="M21.34 15.57a10 10 0 1 1-.57-8.38" />
  </svg>
)
const ZoomInIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
  </svg>
)
const ZoomOutIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35M8 11h6" />
  </svg>
)

/* ── helpers ── */
function makeCenteredCrop(aspect, width, height) {
  if (aspect === undefined) {
    return { unit: '%', x: 5, y: 5, width: 90, height: 90 }
  }
  return centerCrop(
    makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height),
    width,
    height,
  )
}

function rotateSrc(src, degrees) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const rad = (degrees * Math.PI) / 180
      const isPerp = Math.abs(degrees) === 90 || Math.abs(degrees) === 270
      const canvas = document.createElement('canvas')
      canvas.width = isPerp ? img.naturalHeight : img.naturalWidth
      canvas.height = isPerp ? img.naturalWidth : img.naturalHeight
      const ctx = canvas.getContext('2d')
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(rad)
      ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2)
      resolve(canvas.toDataURL('image/jpeg', 0.95))
    }
    img.src = src
  })
}

function getCroppedBlob(imgEl, pixelCrop) {
  const canvas = document.createElement('canvas')
  const scaleX = imgEl.naturalWidth / imgEl.width
  const scaleY = imgEl.naturalHeight / imgEl.height
  canvas.width = Math.floor(pixelCrop.width * scaleX)
  canvas.height = Math.floor(pixelCrop.height * scaleY)
  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    imgEl,
    pixelCrop.x * scaleX,
    pixelCrop.y * scaleY,
    pixelCrop.width * scaleX,
    pixelCrop.height * scaleY,
    0, 0,
    canvas.width,
    canvas.height,
  )
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      0.85,
    )
  })
}

/* ── component ── */
export default function ImageEditor({
  images = [],
  newImages = [],
  onApply,
  onCancel,
  onRemove,
  onAddNew,
}) {
  const allImages = [
    ...images.map((img, i) => ({ url: img.url, _index: i, _type: 'existing' })),
    ...newImages.map((img, i) => ({ url: img.preview, _index: i, _type: 'new' })),
  ]

  const [selectedIdx, setSelectedIdx] = useState(0)
  // imgOverride is set when the user rotates; null = use the original allImages[selectedIdx].url
  const [imgOverride, setImgOverride] = useState(null)
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()
  const [aspect, setAspect] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [applying, setApplying] = useState(false)
  // displaySize: the pixel dimensions the image is fitted to at zoom=1
  const [displaySize, setDisplaySize] = useState(null)
  const imgRef = useRef(null)
  const canvasRef = useRef(null)

  const selected = allImages[selectedIdx] ?? null
  const currentSrc = imgOverride ?? selected?.url ?? null

  /* ── image switching ── */
  const handleSelect = (idx) => {
    setSelectedIdx(idx)
    setImgOverride(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
    setZoom(1)
    setDisplaySize(null)
  }

  /* ── initial crop on image load ── */
  const onImageLoad = (e) => {
    const img = e.currentTarget
    const container = canvasRef.current

    // Compute fitted pixel dimensions so the full image is visible at zoom=1
    let fitW, fitH
    if (container) {
      const pad = 32 // p-4 = 16px each side
      const cw = container.clientWidth - pad
      const ch = container.clientHeight - pad
      const ratio = img.naturalWidth / img.naturalHeight
      if (ratio >= cw / ch) {
        fitW = cw
        fitH = Math.round(cw / ratio)
      } else {
        fitH = ch
        fitW = Math.round(ch * ratio)
      }
    } else {
      // Fallback: constrain to reasonable defaults
      fitW = Math.min(img.naturalWidth, 500)
      fitH = Math.round(fitW / (img.naturalWidth / img.naturalHeight))
    }

    setDisplaySize({ w: fitW, h: fitH })
    setCrop(makeCenteredCrop(aspect, fitW, fitH))
  }

  /* ── aspect ratio ── */
  const handleAspectChange = (value) => {
    setAspect(value)
    if (imgRef.current) {
      const { width, height } = imgRef.current
      setCrop(makeCenteredCrop(value, width, height))
      setCompletedCrop(undefined)
    }
  }

  /* ── rotation (pre-bakes into a new dataURL) ── */
  const handleRotate = async (direction) => {
    if (!currentSrc) return
    setDisplaySize(null) // will be recalculated in onImageLoad
    const newSrc = await rotateSrc(currentSrc, direction === 'left' ? -90 : 90)
    setImgOverride(newSrc)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  /* ── apply crop ── */
  const handleApply = async () => {
    if (!selected || !completedCrop || !imgRef.current) return
    setApplying(true)
    try {
      const blob = await getCroppedBlob(imgRef.current, completedCrop)
      onApply(blob, selected._index, selected._type)
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setApplying(false)
    }
  }

  /* ── remove image ── */
  const handleRemove = () => {
    if (!selected) return
    onRemove(selected._index, selected._type)
    const remaining = allImages.length - 1
    if (remaining > 0) {
      const nextIdx = Math.min(selectedIdx, remaining - 1)
      setSelectedIdx(nextIdx)
      setImgOverride(null)
    } else {
      setImgOverride(null)
    }
    setCrop(undefined)
    setCompletedCrop(undefined)
    setZoom(1)
    setDisplaySize(null)
  }

  // Actual pixel size of the image element (zoom scales from the fitted base)
  const imgW = displaySize ? displaySize.w * zoom : undefined
  const imgH = displaySize ? displaySize.h * zoom : undefined

  return (
    <div className="flex flex-col h-full">

      {/* ── body: left thumbnail rail + right crop canvas ── */}
      <div className="flex flex-1 min-h-0">

        {/* thumbnail rail */}
        <div className="w-[72px] border-r border-gray-200 bg-gray-50 flex flex-col gap-2 p-2 overflow-y-auto flex-shrink-0">
          {allImages.map((img, i) => (
            <button
              key={`${img._type}-${img._index}`}
              type="button"
              onClick={() => handleSelect(i)}
              className={`relative w-full aspect-square rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                selectedIdx === i
                  ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {img._type === 'new' && (
                <span className="absolute bottom-0 left-0 right-0 bg-champagne-500/90 text-white text-[8px] font-bold text-center py-0.5 leading-tight">
                  NEW
                </span>
              )}
            </button>
          ))}

          {/* add more */}
          {allImages.length < 5 && (
            <button
              type="button"
              onClick={onAddNew}
              title="Add more images"
              className="w-full aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 flex items-center justify-center flex-shrink-0 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {/* crop canvas — overflow-auto allows scrolling when zoomed in */}
        <div ref={canvasRef} className="flex-1 bg-gray-200 overflow-auto flex items-start justify-center p-4">
          {currentSrc ? (
            <ReactCrop
              crop={crop}
              onChange={(_, pct) => setCrop(pct)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspect}
              minWidth={20}
              minHeight={20}
            >
              <img
                ref={imgRef}
                src={currentSrc}
                onLoad={onImageLoad}
                alt="Crop"
                style={{
                  display: 'block',
                  width: imgW,
                  height: imgH,
                  // While displaySize is being computed, keep image invisible to avoid
                  // a flash of the full-size image before it gets constrained
                  visibility: displaySize ? 'visible' : 'hidden',
                }}
              />
            </ReactCrop>
          ) : (
            <div className="flex items-center justify-center text-gray-400 w-full h-full">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Select an image to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── bottom toolbar ── */}
      <div className="border-t border-gray-200 bg-white px-3 py-2.5 flex flex-col gap-2">

        {/* tool buttons row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button type="button" disabled={!currentSrc} onClick={() => handleRotate('left')} className="toolbar-btn">
            <RotateLeftIcon /><span>Rotate Left</span>
          </button>
          <button type="button" disabled={!currentSrc} onClick={() => handleRotate('right')} className="toolbar-btn">
            <RotateRightIcon /><span>Rotate Right</span>
          </button>

          <div className="w-px h-6 bg-gray-200 mx-0.5 shrink-0" />

          <button type="button" disabled={!currentSrc} onClick={() => setZoom((z) => Math.min(3, z + 0.25))} className="toolbar-btn">
            <ZoomInIcon /><span>Zoom In</span>
          </button>
          <button type="button" disabled={!currentSrc} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} className="toolbar-btn">
            <ZoomOutIcon /><span>Zoom Out</span>
          </button>

          <div className="w-px h-6 bg-gray-200 mx-0.5 shrink-0" />

          {/* aspect ratio */}
          <div className="flex gap-1">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.label}
                type="button"
                disabled={!currentSrc}
                onClick={() => handleAspectChange(ar.value)}
                className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                  aspect === ar.value
                    ? 'bg-navy-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40'
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* action buttons row */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!selected}
            onClick={handleRemove}
            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-40"
          >
            Remove Image
          </button>
          <div className="flex-1" />
          <button type="button" onClick={onCancel}
            className="px-4 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={!selected || !completedCrop || applying}
            className="px-5 py-1.5 text-xs font-semibold text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {applying ? 'Processing…' : 'Apply Crop'}
          </button>
        </div>
      </div>

      <style>{`
        .toolbar-btn {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 6px 10px; border-radius: 8px;
          border: 1px solid #e5e7eb; background: white;
          font-size: 12px; font-weight: 500; color: #374151;
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .toolbar-btn:hover:not(:disabled) { background: #f3f4f6; }
        .toolbar-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Blue dashed crop border matching the Vyapar reference */
        .ReactCrop__crop-selection {
          border: 2px dashed #3b82f6 !important;
          box-shadow: 0 0 0 9999em rgba(0,0,0,0.35) !important;
        }
        .ReactCrop__drag-handle::after {
          background-color: #3b82f6 !important;
          border-color: #3b82f6 !important;
          width: 10px !important; height: 10px !important;
        }
      `}</style>
    </div>
  )
}
