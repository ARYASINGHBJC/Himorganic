
import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial, Float, Torus } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedLeaf({ position, color, speed = 1, distort = 0.3 }: { 
  position: [number, number, number]
  color: string
  speed?: number
  distort?: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 * speed
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 * speed
    }
  })

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 64, 64]} position={position}>
        <MeshDistortMaterial
          color={color}
          attach="material"
          distort={distort}
          speed={2}
          roughness={0.3}
          metalness={0.6}
        />
      </Sphere>
    </Float>
  )
}

function FloatingRing({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1.5}>
      <Torus ref={meshRef} args={[1, 0.1, 16, 100]} position={position}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </Torus>
    </Float>
  )
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null)
  const count = 300

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 25
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25
      pos[i * 3 + 2] = (Math.random() - 0.5) * 25
    }
    return pos
  }, [])

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3)
    const color1 = new THREE.Color('#22c55e')
    const color2 = new THREE.Color('#84cc16')
    const color3 = new THREE.Color('#10b981')
    
    for (let i = 0; i < count; i++) {
      const rand = Math.random()
      const color = rand < 0.33 ? color1 : rand < 0.66 ? color2 : color3
      cols[i * 3] = color.r
      cols[i * 3 + 1] = color.g
      cols[i * 3 + 2] = color.b
    }
    return cols
  }, [])

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.03
      particlesRef.current.rotation.x = state.clock.elapsedTime * 0.02
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1.2} />
        <pointLight position={[-10, -10, -5]} intensity={0.6} color="#22c55e" />
        <pointLight position={[10, -10, 5]} intensity={0.6} color="#84cc16" />
        <pointLight position={[0, 10, 0]} intensity={0.4} color="#10b981" />
        
        {/* Organic floating spheres */}
        <AnimatedLeaf position={[-4, 1.5, 0]} color="#22c55e" speed={0.6} distort={0.4} />
        <AnimatedLeaf position={[4, -1, -2]} color="#16a34a" speed={0.9} distort={0.3} />
        <AnimatedLeaf position={[0, 2.5, -4]} color="#84cc16" speed={0.5} distort={0.35} />
        <AnimatedLeaf position={[-2, -2, -1]} color="#10b981" speed={0.7} distort={0.25} />
        
        {/* Decorative rings */}
        <FloatingRing position={[3, 2, -3]} color="#22c55e" />
        <FloatingRing position={[-3, -1.5, -2]} color="#84cc16" />
        
        <FloatingParticles />
      </Canvas>
    </div>
  )
}