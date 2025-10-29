'use client'

import { useRef, useState, Suspense, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { XR, createXRStore } from '@react-three/xr'
import { Box, Text } from '@react-three/drei'
import * as THREE from 'three'

// Tractor Model Component
function TractorModel({ position, scale = 1 }: { position: [number, number, number], scale?: number }) {
  const groupRef = useRef<THREE.Group>(null)

  return (
    <group ref={groupRef} position={position} scale={scale}>
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

// AR Hit Test Component for placing objects
function ARPlacement() {
  const [placed, setPlaced] = useState(false)
  const [position, setPosition] = useState<[number, number, number]>([0, 0, -2])
  const [scale, setScale] = useState(0.3)
  const reticleRef = useRef<THREE.Mesh>(null)
  const { gl, scene } = useThree()

  // Animate reticle pulsing effect
  useFrame((state) => {
    if (reticleRef.current && !placed) {
      reticleRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.1)
    }
  })

  // In a real AR app, you'd use hit-testing API here
  const handlePlacement = () => {
    if (!placed) {
      setPlaced(true)
    }
  }

  return (
    <>
      {/* Placement Reticle - shows where object will be placed */}
      {!placed && (
        <group onClick={handlePlacement}>
          <mesh
            ref={reticleRef}
            position={position}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.15, 0.2, 32]} />
            <meshBasicMaterial color="#00ff00" opacity={0.7} transparent />
          </mesh>
          <mesh position={[position[0], position[1] + 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.05, 0.08, 32]} />
            <meshBasicMaterial color="#ffffff" opacity={0.9} transparent />
          </mesh>
        </group>
      )}

      {/* Placed Tractor */}
      {placed && (
        <group>
          <TractorModel position={position} scale={scale} />
          {/* Shadow plane */}
          <mesh position={[position[0], position[1] - 0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1, 32]} />
            <meshBasicMaterial color="#000000" opacity={0.3} transparent />
          </mesh>
        </group>
      )}

      {/* Instruction Text */}
      {!placed && (
        <Text
          position={[0, 0.5, -2]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Tap green circle to place tractor
        </Text>
      )}

      {placed && (
        <Text
          position={[position[0], position[1] + 1.5, position[2]]}
          fontSize={0.08}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Tractor placed! Walk around to view
        </Text>
      )}
    </>
  )
}

// Main AR Scene
function ARScene() {
  return (
    <>
      {/* Lighting for AR */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {/* AR Placement System */}
      <ARPlacement />
    </>
  )
}

export default function WebXRARViewer() {
  const [arSupported, setArSupported] = useState<boolean | null>(null)
  const [error, setError] = useState<string>('')
  const store = createXRStore()

  // Check AR support on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      (navigator as any).xr?.isSessionSupported('immersive-ar').then((supported: boolean) => {
        setArSupported(supported)
        if (!supported) {
          setError('AR is not supported on this device')
        }
      }).catch(() => {
        setArSupported(false)
        setError('Failed to check AR support')
      })
    } else {
      setArSupported(false)
      setError('WebXR is not available in this browser')
    }
  }, [])

  return (
    <div className="w-full space-y-4">
      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-purple-900">
              🚜 AR Product Placement
            </h3>
            <p className="text-sm text-purple-700 mt-1">
              View farming equipment in your real environment using AR
            </p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-700 space-y-2">
          <p>• Point your camera at a flat surface</p>
          <p>• Tap to place the tractor in your space</p>
          <p>• Walk around to view from different angles</p>
          <p>• Pinch to resize, drag to move</p>
        </div>
      </div>

      {/* AR Viewer Container */}
      <div className="relative w-full h-[500px] bg-black rounded-lg overflow-hidden border-2 border-purple-300">
        {/* XR Button - This triggers AR session */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4">
          <button
            onClick={() => {
              store.enterAR()
            }}
            disabled={!arSupported}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {arSupported === null ? 'Checking AR Support...' :
             arSupported ? '📱 Start AR Experience' : '⚠️ AR Not Available'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="absolute top-20 left-4 right-4 bg-blue-100 border border-blue-300 rounded-lg p-3 text-sm text-blue-800">
            <strong>💡 WebXR AR requires a mobile device</strong>
            <p className="mt-2">
              This feature needs ARCore (Android 7+) or ARKit (iOS 12+).
              On desktop/Mac, try the <strong>"Camera AR (Lenskart-style)"</strong> option instead!
            </p>
          </div>
        )}

        {/* Canvas with XR support */}
        <Canvas>
          <XR store={store}>
            <Suspense fallback={null}>
              <ARScene />
            </Suspense>
          </XR>
        </Canvas>

        {/* Instructions Overlay */}
        <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-xs text-gray-700 shadow-md">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <strong>Device Requirements:</strong>
              <p>• iOS 12+ with ARKit</p>
              <p>• Android 7+ with ARCore</p>
            </div>
            <div>
              <strong>Browser Support:</strong>
              <p>• Chrome/Safari mobile</p>
              <p>• WebXR compatible</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fallback for Desktop */}
      {arSupported === false && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>💡 Desktop User?</strong>
          <p className="mt-2">
            For the best AR experience, open this page on your smartphone. You can scan this QR code or send yourself the link:
          </p>
          <div className="mt-3 bg-white p-4 rounded inline-block">
            <p className="text-xs text-gray-600 mb-2">
              {typeof window !== 'undefined' ? window.location.href : 'Loading...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
