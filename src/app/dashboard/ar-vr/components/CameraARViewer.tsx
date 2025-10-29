'use client'

import { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Box, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

// Tractor Model Component (same as before but optimized)
function TractorModel({ scale = 0.5, rotation = [0, 0, 0] }: { scale?: number, rotation?: [number, number, number] }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.3) * 0.05
    }
  })

  return (
    <group ref={groupRef} scale={scale} rotation={rotation}>
      {/* Tractor Body */}
      <Box args={[2, 1, 1]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color="#dc2626" metalness={0.6} roughness={0.4} />
      </Box>

      {/* Cabin */}
      <Box args={[0.8, 0.8, 0.8]} position={[0.4, 1.3, 0]}>
        <meshStandardMaterial color="#991b1b" metalness={0.5} roughness={0.3} />
      </Box>

      {/* Engine Hood */}
      <Box args={[1, 0.6, 0.9]} position={[-0.8, 0.5, 0]}>
        <meshStandardMaterial color="#b91c1c" metalness={0.7} roughness={0.3} />
      </Box>

      {/* Back Wheels (larger) */}
      <mesh position={[0.7, -0.2, 0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.8} />
      </mesh>
      <mesh position={[0.7, -0.2, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.6, 0.6, 0.3, 16]} />
        <meshStandardMaterial color="#1f2937" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* Front Wheels (smaller) */}
      <mesh position={[-0.9, -0.1, 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.8} />
      </mesh>
      <mesh position={[-0.9, -0.1, -0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 0.3, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.8} />
      </mesh>

      {/* Exhaust Pipe */}
      <mesh position={[-0.3, 1.5, 0.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 1, 8]} />
        <meshStandardMaterial color="#4b5563" metalness={0.9} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Camera Video Background Component
function CameraBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    // Request camera access
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        })
        setStream(mediaStream)
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream
          videoRef.current.play()
        }
      } catch (err) {
        console.error('Error accessing camera:', err)
      }
    }

    startCamera()

    // Cleanup
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover"
      style={{ transform: 'scaleX(-1)' }} // Mirror for front camera
    />
  )
}

export default function CameraARViewer() {
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [modelScale, setModelScale] = useState(0.5)
  const [modelRotation, setModelRotation] = useState(0)
  const [showControls, setShowControls] = useState(true)

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      setCameraActive(true)
      setCameraError('')
      // Stream will be handled by CameraBackground component
      stream.getTracks().forEach(track => track.stop()) // Stop this test stream
    } catch (err: any) {
      setCameraError(err.message || 'Failed to access camera')
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    setCameraActive(false)
  }

  return (
    <div className="w-full space-y-4">
      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              📷 Camera AR Experience
            </h3>
            <p className="text-sm text-blue-700 mt-1">
              See farming equipment through your camera (Lenskart-style)
            </p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700 space-y-2">
          <p>• Click "Start Camera" to enable your device camera</p>
          <p>• The 3D tractor will overlay on your camera view</p>
          <p>• Use controls to adjust size and rotation</p>
          <p>• Works best with good lighting</p>
        </div>
      </div>

      {/* Camera Controls */}
      <div className="flex gap-3">
        {!cameraActive ? (
          <button
            onClick={startCamera}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold text-lg flex items-center justify-center gap-2"
          >
            📷 Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={stopCamera}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              🛑 Stop Camera
            </button>
            <button
              onClick={() => setShowControls(!showControls)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {showControls ? '🔽' : '🔼'}
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {cameraError && (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-sm text-red-800">
          <strong>Camera Error:</strong> {cameraError}
          <p className="mt-2 text-xs">
            Please allow camera access in your browser settings and try again.
          </p>
        </div>
      )}

      {/* AR Viewer with Camera Background */}
      <div className="relative w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden border-2 border-blue-300">
        {/* Camera Background */}
        {cameraActive && <CameraBackground />}

        {/* 3D Canvas Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            gl={{ alpha: true }}
            style={{ background: 'transparent' }}
          >
            {/* Lighting */}
            <ambientLight intensity={0.8} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <spotLight position={[-10, 10, 10]} angle={0.3} penumbra={1} intensity={0.5} />

            {/* Tractor Model */}
            <TractorModel scale={modelScale} rotation={[0, modelRotation, 0]} />

            {/* Optional: Add orbit controls for desktop */}
            {!cameraActive && (
              <OrbitControls
                enableZoom={true}
                enablePan={false}
                minDistance={3}
                maxDistance={8}
              />
            )}
          </Canvas>
        </div>

        {/* Model Controls Overlay */}
        {cameraActive && showControls && (
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Size</label>
                <span className="text-xs text-gray-600">{Math.round(modelScale * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.5"
                step="0.1"
                value={modelScale}
                onChange={(e) => setModelScale(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-gray-700">Rotation</label>
                <span className="text-xs text-gray-600">{Math.round((modelRotation * 180) / Math.PI)}°</span>
              </div>
              <input
                type="range"
                min="0"
                max={Math.PI * 2}
                step="0.1"
                value={modelRotation}
                onChange={(e) => setModelRotation(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                onClick={() => setModelScale(0.5)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm font-semibold transition-colors"
              >
                Reset Size
              </button>
              <button
                onClick={() => setModelRotation(0)}
                className="bg-blue-100 hover:bg-blue-200 text-blue-800 px-3 py-2 rounded text-sm font-semibold transition-colors"
              >
                Reset Rotation
              </button>
              <button
                onClick={() => {
                  setModelScale(0.5)
                  setModelRotation(0)
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>
        )}

        {/* Instructions when camera is off */}
        {!cameraActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 max-w-md text-center">
              <div className="text-6xl mb-4">📷</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Camera AR Mode</h3>
              <p className="text-gray-700 text-sm">
                Enable your camera to see the tractor overlaid on your real environment.
                This works similar to Lenskart's virtual try-on feature!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Feature Info */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
        <h4 className="font-semibold text-green-900 mb-2">✨ Lenskart-Style Features</h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-green-800">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Live camera feed
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span> 3D model overlay
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span> Real-time size adjustment
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✓</span> 360° rotation control
          </div>
        </div>
      </div>

      {/* Browser Compatibility */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        <strong>📱 Browser Requirements:</strong>
        <p className="mt-1">
          Camera access works on Chrome, Safari, Firefox, and Edge.
          Mobile devices may require HTTPS. If camera doesn't work, check browser permissions.
        </p>
      </div>
    </div>
  )
}
