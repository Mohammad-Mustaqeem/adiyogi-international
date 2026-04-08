import { useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'

const ASPECT_RATIOS = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: undefined },
]

export default function ImageEditor({
  images = [],
  newImages = [],
  onApply,
  onCancel,
  onRemove,
  onAddNew,
}) {
  const [selectedIndex, setSelectedIndex] = useState(
    images.length > 0 ? 0 : newImages.length > 0 ? -1 : null
  )
  const [selectedType, setSelectedType] = useState(
    images.length > 0 ? 'existing' : 'new'
  )
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [aspect, setAspect] = useState(1)
  const [cropping, setCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [cropSize, setCropSize] = useState({ width: 200, height: 200 })
  const containerRef = useRef(null)

  const allImages = [
    ...images.map((img, i) => ({ ...img, _index: i, _type: 'existing' })),
    ...newImages.map((img, i) => ({
      ...img,
      url: img.preview,
      _index: i,
      _type: 'new',
    })),
  ]

  const selectedImage = allImages.find(
    (_, i) =>
      i === selectedIndex &&
      ((selectedType === 'existing' && i < images.length) ||
        (selectedType === 'new' && i >= images.length))
  )

  const handleSelect = (index, type) => {
    setSelectedIndex(index)
    setSelectedType(type)
    setZoom(1)
    setRotation(0)
    setCrop({ x: 0, y: 0 })
    setCroppedAreaPixels(null)
    setCropSize({ width: 200, height: 200 })
    setAspect(1)
  }

  const handleAspectChange = (newAspect) => {
    setAspect(newAspect)
    if (newAspect === undefined) {
      setCropSize({ width: 400, height: 400 })
    } else {
      setCropSize({ width: 280, height: 280 / newAspect })
    }
  }

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const onCropChange = useCallback((c) => {
    setCrop(c)
  }, [])

  const rotateLeft = () => setRotation((r) => (r - 90) % 360)
  const rotateRight = () => setRotation((r) => (r + 90) % 360)

  const getCroppedImg = (imageSrc, pixelCrop, imgRotation) => {
    return new Promise((resolve, reject) => {
      const image = new Image()
      image.crossOrigin = 'anonymous'
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        const maxSize = Math.max(image.width, image.height)
        const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

        canvas.width = safeArea
        canvas.height = safeArea

        ctx.translate(safeArea / 2, safeArea / 2)
        ctx.rotate((imgRotation * Math.PI) / 180)

        ctx.drawImage(
          image,
          safeArea / 2 - image.width * 0.5,
          safeArea / 2 - image.height * 0.5
        )

        const data = ctx.getImageData(0, 0, safeArea, safeArea)

        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height

        ctx.putImageData(
          data,
          Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
          Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
        )

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas is empty'))
              return
            }
            blob.name = 'cropped-image.jpg'
            resolve(blob)
          },
          'image/jpeg',
          0.85
        )
      }
      image.onerror = reject
      image.src = imageSrc
    })
  }

  const handleApply = async () => {
    if (!selectedImage || !croppedAreaPixels) return
    setCropping(true)
    try {
      const croppedBlob = await getCroppedImg(
        selectedImage.url,
        croppedAreaPixels,
        rotation
      )
      onApply(croppedBlob, selectedIndex, selectedType)
    } catch (err) {
      console.error('Crop error:', err)
    } finally {
      setCropping(false)
    }
  }

  const handleRemove = () => {
    if (selectedImage) {
      onRemove(selectedIndex, selectedType)
      const newLength = selectedType === 'existing' ? images.length - 1 : images.length
      if (newLength > 0) {
        setSelectedIndex(0)
        setSelectedType('existing')
      } else if (images.length === 0 && newImages.length > 1) {
        setSelectedIndex(images.length)
        setSelectedType('new')
      } else {
        setSelectedIndex(null)
        setSelectedType(null)
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="lg:w-32 flex-shrink-0">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-64 pb-2 lg:pb-0">
            {images.map((img, i) => (
              <button
                key={`existing-${i}`}
                type="button"
                onClick={() => handleSelect(i, 'existing')}
                className={`relative w-16 h-16 lg:w-full lg:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                  selectedIndex === i && selectedType === 'existing'
                    ? 'border-navy-700 ring-2 ring-navy-200'
                    : 'border-gray-200 hover:border-navy-300'
                }`}
              >
                <img
                  src={img.url}
                  alt={`Image ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-navy-800/70 text-white text-[9px] font-bold text-center py-0.5">
                  {i + 1}
                </div>
              </button>
            ))}
            {newImages.map((img, i) => (
              <button
                key={`new-${i}`}
                type="button"
                onClick={() => handleSelect(images.length + i, 'new')}
                className={`relative w-16 h-16 lg:w-full lg:h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                  selectedIndex === images.length + i && selectedType === 'new'
                    ? 'border-champagne-500 ring-2 ring-champagne-200'
                    : 'border-champagne-300 hover:border-champagne-400'
                }`}
              >
                <img
                  src={img.preview}
                  alt={`New ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-champagne-500 text-white text-[9px] font-bold text-center py-0.5">
                  NEW
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={onAddNew}
              className="w-16 h-16 lg:w-full lg:h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-navy-400 hover:bg-navy-50 flex items-center justify-center flex-shrink-0 transition-colors"
              title="Add more images"
            >
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-[300px] lg:min-h-[400px]" ref={containerRef}>
          {selectedImage ? (
            <div className="relative w-full h-full min-h-[300px] lg:min-h-[400px] bg-gray-100 rounded-xl overflow-hidden">
              <Cropper
                image={selectedImage.url}
                crop={crop}
                rotation={rotation}
                zoom={zoom}
                aspect={aspect}
                onCropChange={onCropChange}
                onCropComplete={onCropComplete}
                onRotationChange={setRotation}
                cropSize={cropSize}
                objectFit="contain"
                classes={{
                  containerClassName: '!bg-gray-100',
                  mediaClassName: 'max-w-full max-h-full object-contain',
                }}
                restrictPosition={false}
              />
            </div>
          ) : (
            <div className="w-full h-full min-h-[300px] lg:min-h-[400px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              <div className="text-center">
                <svg
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">Select an image to edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedImage && (
        <>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Rotate
              </span>
              <button
                type="button"
                onClick={rotateLeft}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Rotate left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={rotateRight}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Rotate right"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" transform="scale(-1, 1)" />
                </svg>
              </button>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-300" />

            <div className="flex items-center gap-3 flex-1">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Zoom
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(1, z - 0.25))}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Zoom out"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-700"
              />
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                className="w-9 h-9 rounded-lg bg-white border border-gray-200 hover:bg-gray-100 flex items-center justify-center transition-colors"
                title="Zoom in"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
              <span className="text-xs text-gray-500 w-10">{zoom.toFixed(1)}x</span>
            </div>

            <div className="hidden sm:block w-px h-8 bg-gray-300" />

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Crop
              </span>
              <div className="flex gap-1">
                {ASPECT_RATIOS.map((ar) => (
                  <button
                    key={ar.label}
                    type="button"
                    onClick={() => handleAspectChange(ar.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      aspect === ar.value
                        ? 'bg-navy-700 text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {ar.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleRemove}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              Remove Image
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={cropping}
              className="px-6 py-2 text-sm font-medium text-white bg-navy-700 hover:bg-navy-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {cropping ? 'Processing...' : 'Apply Changes'}
            </button>
          </div>
        </>
      )}

      <style>{`
        .reactEasyCrop_Container {
          background: #f3f4f6 !important;
        }
        .reactEasyCrop_CropArea {
          border: 2px solid #1B3A6B !important;
          color: rgba(27, 58, 107, 0.6) !important;
        }
        .reactEasyCrop_CropArea:hover {
          color: rgba(27, 58, 107, 0.8) !important;
        }
        .reactEasyCrop_CropAreaGrab {
          cursor: move !important;
        }
        .reactEasyCrop_CropAreaGrabbing {
          cursor: move !important;
        }
      `}</style>
    </div>
  )
}
