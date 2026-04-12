import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type Geom3 from '@jscad/modeling/src/geometries/geom3/type'
import { geom3ToBufferGeometry } from '../geometry/jscadToThree'

export interface PreviewViewportProps {
  readonly geometry: Geom3 | null
  readonly cameraPosition: readonly [number, number, number]
  readonly target: readonly [number, number, number]
  readonly className?: string
}

/**
 * Three.js canvas with orbit controls; mesh updates when JSCAD geometry changes.
 */
export function PreviewViewport({
  geometry,
  cameraPosition,
  target,
  className = '',
}: PreviewViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const meshRef = useRef<THREE.Mesh | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf1f5f9)

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000)
    camera.position.set(cameraPosition[0], cameraPosition[1], cameraPosition[2])
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    el.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(target[0], target[1], target[2])
    controls.update()
    controlsRef.current = controls

    scene.add(new THREE.AmbientLight(0xffffff, 0.65))
    const dir = new THREE.DirectionalLight(0xffffff, 0.85)
    dir.position.set(40, 80, 40)
    scene.add(dir)

    const mat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.15,
      roughness: 0.55,
    })
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat)
    meshRef.current = mesh
    scene.add(mesh)

    const grid = new THREE.GridHelper(200, 20, 0xcbd5e1, 0xe2e8f0)
    grid.position.y = -0.01
    scene.add(grid)

    function resize() {
      if (!el) return
      const w = el.clientWidth
      const h = el.clientHeight || 1
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)

    let raf = 0
    function tick() {
      raf = requestAnimationFrame(tick)
      controls.update()
      renderer.render(scene, camera)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      mesh.geometry.dispose()
      mat.dispose()
      renderer.dispose()
      if (renderer.domElement.parentElement === el) el.removeChild(renderer.domElement)
      meshRef.current = null
      cameraRef.current = null
      controlsRef.current = null
    }
  }, [cameraPosition, target])

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    function applyGeom() {
      if (cancelled) return
      const mesh = meshRef.current
      if (mesh && geometry) {
        const old = mesh.geometry
        mesh.geometry = geom3ToBufferGeometry(geometry)
        old.dispose()
        return
      }
      attempts += 1
      if (attempts < 90) requestAnimationFrame(applyGeom)
    }
    applyGeom()
    return () => {
      cancelled = true
    }
  }, [geometry])

  return (
    <div
      ref={containerRef}
      data-preview-viewport
      data-testid="preview-viewport"
      className={`relative min-h-[320px] w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-900 ${className}`}
    />
  )
}
