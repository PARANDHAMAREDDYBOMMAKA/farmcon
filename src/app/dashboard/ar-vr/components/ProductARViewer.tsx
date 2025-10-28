'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Text } from '@react-three/drei'
import { Mesh } from 'three'

// Simplified Tractor 3D Model (using basic shapes)
function TractorModel() {
  const groupRef = useRef<any>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
    }
  })

  return (
    <group
      ref={groupRef}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.1 : 1}
    >
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

export default function ProductARViewer() {
  const [showInfo, setShowInfo] = useState(true)

  return (
    <div className="w-full space-y-4">
      {/* Product Info Card */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-red-900">Heavy-Duty Farm Tractor</h3>
            <p className="text-sm text-red-700 mt-1">50 HP | Diesel Engine | 4WD</p>
            <div className="mt-2 flex items-center gap-4">
              <span className="text-xl font-bold text-red-900">₹500/day</span>
              <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded">Available</span>
            </div>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-red-600 hover:text-red-800"
          >
            {showInfo ? '▼' : '▲'}
          </button>
        </div>

        {showInfo && (
          <div className="mt-4 text-sm text-gray-700 space-y-2">
            <p>• Perfect for plowing, tilling, and heavy farm work</p>
            <p>• Fuel efficient with modern engine technology</p>
            <p>• Easy to operate controls</p>
            <p>• Free delivery within 10km radius</p>
          </div>
        )}
      </div>

      {/* 3D Viewer */}
      <div className="relative w-full h-[450px] bg-gradient-to-b from-sky-100 to-green-100 rounded-lg overflow-hidden border-2 border-gray-200">
        <Canvas camera={{ position: [4, 3, 4], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <spotLight position={[-10, 10, 10]} angle={0.3} penumbra={1} intensity={0.5} />

          {/* Tractor Model */}
          <TractorModel />

          {/* Ground Plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.8, 0]} receiveShadow>
            <planeGeometry args={[10, 10]} />
            <meshStandardMaterial color="#86efac" />
          </mesh>

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>

        {/* AR Button (Mobile) */}
        <button className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all font-semibold flex items-center gap-2">
          <span>📱</span>
          View in AR
          <span className="text-xs bg-white/20 px-2 py-1 rounded">Coming Soon</span>
        </button>

        {/* Controls Info */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-gray-700 shadow-md">
          <p><strong>Rotate:</strong> Click & drag around</p>
          <p><strong>Zoom:</strong> Scroll or pinch</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors">
          Rent Now
        </button>
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-6 rounded-lg font-semibold transition-colors border border-gray-300">
          Contact Owner
        </button>
      </div>
    </div>
  )
}
