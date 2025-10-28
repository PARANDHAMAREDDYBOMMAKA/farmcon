'use client'

import { useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Box, Sphere, Cone } from '@react-three/drei'
import { Mesh } from 'three'

// Animated 3D Box
function RotatingBox() {
  const meshRef = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5
      meshRef.current.rotation.y += delta * 0.3
    }
  })

  return (
    <Box
      ref={meshRef}
      args={[1, 1, 1]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      <meshStandardMaterial color={hovered ? '#10b981' : '#3b82f6'} />
    </Box>
  )
}

// Animated Sphere
function FloatingSphere() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.5
    }
  })

  return (
    <Sphere ref={meshRef} args={[0.5, 32, 32]} position={[-2, 0, 0]}>
      <meshStandardMaterial color="#f59e0b" />
    </Sphere>
  )
}

// Animated Cone
function SpinningCone() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 0.8
    }
  })

  return (
    <Cone ref={meshRef} args={[0.5, 1, 32]} position={[2, 0, 0]}>
      <meshStandardMaterial color="#ef4444" />
    </Cone>
  )
}

export default function BasicARViewer() {
  return (
    <div className="w-full h-[500px] bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />

        {/* 3D Objects */}
        <RotatingBox />
        <FloatingSphere />
        <SpinningCone />

        {/* Controls */}
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={3}
          maxDistance={10}
        />

        {/* Grid Helper */}
        <gridHelper args={[10, 10]} />
      </Canvas>

      {/* Controls Info */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-xs text-gray-700 shadow-md">
        <p><strong>Mouse:</strong> Drag to rotate | Scroll to zoom</p>
        <p><strong>Touch:</strong> 1 finger rotate | 2 finger zoom</p>
      </div>
    </div>
  )
}
