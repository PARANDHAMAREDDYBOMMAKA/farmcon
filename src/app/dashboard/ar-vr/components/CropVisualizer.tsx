'use client'

import { useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Box, Sphere, Text } from '@react-three/drei'

// Individual Crop Plant
function CropPlant({ position, type }: { position: [number, number, number]; type: string }) {
  const colors: Record<string, string> = {
    wheat: '#f59e0b',
    rice: '#84cc16',
    corn: '#eab308',
    tomato: '#ef4444',
  }

  return (
    <group position={position}>
      {/* Stem */}
      <Box args={[0.05, 0.6, 0.05]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#16a34a" />
      </Box>
      {/* Top (crop) */}
      <Sphere args={[0.15, 16, 16]} position={[0, 0.65, 0]}>
        <meshStandardMaterial color={colors[type] || '#22c55e'} />
      </Sphere>
    </group>
  )
}

// Crop Field Grid
function CropField({ crop, rows, cols }: { crop: string; rows: number; cols: number }) {
  const plants = []
  const spacing = 0.8

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = (i - rows / 2) * spacing
      const z = (j - cols / 2) * spacing
      plants.push(
        <CropPlant
          key={`${i}-${j}`}
          position={[x, 0, z]}
          type={crop}
        />
      )
    }
  }

  return <group>{plants}</group>
}

export default function CropVisualizer() {
  const [selectedCrop, setSelectedCrop] = useState('wheat')
  const [gridSize, setGridSize] = useState({ rows: 5, cols: 5 })

  const crops = [
    { id: 'wheat', name: 'Wheat', emoji: '🌾', color: 'from-yellow-400 to-orange-400' },
    { id: 'rice', name: 'Rice', emoji: '🌾', color: 'from-green-400 to-lime-400' },
    { id: 'corn', name: 'Corn', emoji: '🌽', color: 'from-yellow-500 to-yellow-600' },
    { id: 'tomato', name: 'Tomato', emoji: '🍅', color: 'from-red-400 to-red-600' },
  ]

  return (
    <div className="w-full space-y-4">
      {/* Crop Selection */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <h3 className="font-semibold text-green-900 mb-3">Select Crop Type:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {crops.map((crop) => (
            <button
              key={crop.id}
              onClick={() => setSelectedCrop(crop.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedCrop === crop.id
                  ? 'border-green-600 bg-green-100 shadow-md scale-105'
                  : 'border-gray-300 bg-white hover:border-green-400'
              }`}
            >
              <div className="text-2xl mb-1">{crop.emoji}</div>
              <div className="text-sm font-medium text-gray-800">{crop.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Field Size Controls */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Field Size:</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 block mb-1">Rows: {gridSize.rows}</label>
            <input
              type="range"
              min="3"
              max="10"
              value={gridSize.rows}
              onChange={(e) => setGridSize({ ...gridSize, rows: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm text-gray-700 block mb-1">Columns: {gridSize.cols}</label>
            <input
              type="range"
              min="3"
              max="10"
              value={gridSize.cols}
              onChange={(e) => setGridSize({ ...gridSize, cols: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-3 text-sm text-blue-800">
          Total plants: <strong>{gridSize.rows * gridSize.cols}</strong>
        </div>
      </div>

      {/* 3D Field Viewer */}
      <div className="relative w-full h-[450px] bg-gradient-to-b from-sky-200 to-green-200 rounded-lg overflow-hidden border-2 border-gray-200">
        <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, 10, -10]} intensity={0.3} />

          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[12, 12]} />
            <meshStandardMaterial color="#7c3aed" opacity={0.3} transparent />
          </mesh>

          {/* Soil Base */}
          <Box args={[gridSize.rows * 0.8 + 0.5, 0.1, gridSize.cols * 0.8 + 0.5]} position={[0, -0.05, 0]}>
            <meshStandardMaterial color="#92400e" />
          </Box>

          {/* Crop Field */}
          <CropField crop={selectedCrop} rows={gridSize.rows} cols={gridSize.cols} />

          {/* Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            minDistance={4}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>

        {/* Info Overlay */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-3 text-sm shadow-md">
          <p className="font-semibold text-gray-800">
            {crops.find(c => c.id === selectedCrop)?.emoji}{' '}
            {crops.find(c => c.id === selectedCrop)?.name} Field
          </p>
          <p className="text-gray-600 text-xs mt-1">
            {gridSize.rows}x{gridSize.cols} layout
          </p>
        </div>

        {/* Controls Info */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-gray-700 shadow-md">
          <p><strong>View:</strong> Drag to rotate | Scroll to zoom</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-100 to-green-50 rounded-lg p-4 border border-green-200 text-center">
          <div className="text-2xl font-bold text-green-800">{gridSize.rows * gridSize.cols}</div>
          <div className="text-xs text-green-600 mt-1">Total Plants</div>
        </div>
        <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-4 border border-blue-200 text-center">
          <div className="text-2xl font-bold text-blue-800">{(gridSize.rows * gridSize.cols * 0.8).toFixed(1)}m²</div>
          <div className="text-xs text-blue-600 mt-1">Field Area</div>
        </div>
        <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-lg p-4 border border-purple-200 text-center">
          <div className="text-2xl font-bold text-purple-800">{Math.ceil(gridSize.rows * gridSize.cols / 10)}</div>
          <div className="text-xs text-purple-600 mt-1">Estimated Yield (kg)</div>
        </div>
      </div>
    </div>
  )
}
