import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { MeshDistortMaterial } from '@react-three/drei'

function AnimatedSphere() {
  const meshRef = useRef()

  useFrame((state) => {
    // Use performance.now() instead of state.clock to avoid deprecation warnings
    const time = performance.now() * 0.001
    if (meshRef.current) {
      meshRef.current.rotation.x = time * 0.1
      meshRef.current.rotation.y = time * 0.15
    }
  })

  return (
    <mesh ref={meshRef} scale={2.5}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color="#dc2626"
        attach="material"
        distort={0.4}
        speed={1.5}
        roughness={0.8}
        metalness={0.1}
        opacity={0.08}
        transparent
      />
    </mesh>
  )
}

export default function ThreeBackground() {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none'
    }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ 
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance"
        }}
        onCreated={({ gl }) => {
          // Handle WebGL context loss
          gl.domElement.addEventListener('webglcontextlost', (event) => {
            event.preventDefault()
            console.warn('WebGL context lost, attempting to restore...')
          })
          
          gl.domElement.addEventListener('webglcontextrestored', () => {
            console.log('WebGL context restored')
          })
        }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <AnimatedSphere />
      </Canvas>
    </div>
  )
}
