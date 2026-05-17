import { RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { Button } from "../../components/ui/button";
import type { BracketGeometry } from "../../domain/brackets/flatLBracket";
import { geometryToThreeBuffer } from "./geometryToThreeBuffer";

type BracketPreviewProps = {
  geometry: BracketGeometry;
};

export function BracketPreview({ geometry }: BracketPreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    const host = hostRef.current;

    if (!host || typeof WebGLRenderingContext === "undefined") {
      return;
    }

    const style = getComputedStyle(host);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    const controls = new OrbitControls(camera, renderer.domElement);
    const meshGeometry = geometryToThreeBuffer(geometry);
    meshGeometry.center();
    meshGeometry.computeBoundingSphere();
    const material = new THREE.MeshStandardMaterial({
      color: threeColorFromToken(style.getPropertyValue("--preview-face")),
      roughness: 0.56,
      metalness: 0.04,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(meshGeometry, material);
    const boundingRadius = Math.max(
      40,
      meshGeometry.boundingSphere?.radius ?? 80,
    );
    const gridSize = boundingRadius * 3;
    const grid = new THREE.GridHelper(
      gridSize,
      24,
      threeColorFromToken(style.getPropertyValue("--border-default")),
      threeColorFromToken(style.getPropertyValue("--preview-grid")),
    );

    renderer.setClearColor(
      threeColorFromToken(style.getPropertyValue("--surface-sunken")),
      1,
    );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.domElement.setAttribute("aria-label", "Generated bracket preview");
    renderer.domElement.className = "h-full w-full";

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.rotation.x = -Math.PI / 2;
    mesh.updateMatrixWorld(true);

    const meshBounds = new THREE.Box3().setFromObject(mesh);
    grid.position.y = meshBounds.min.y - Math.max(4, boundingRadius * 0.04);
    scene.add(grid);
    scene.add(mesh);
    const lightColor = threeColorFromToken(
      style.getPropertyValue("--preview-light"),
    );
    const groundLightColor = threeColorFromToken(
      style.getPropertyValue("--preview-ground-light"),
    );

    scene.add(new THREE.HemisphereLight(lightColor, groundLightColor, 1.8));

    const keyLight = new THREE.DirectionalLight(lightColor, 2.2);
    keyLight.position.set(80, 140, 120);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(lightColor, 0.8);
    fillLight.position.set(-120, 60, -80);
    scene.add(fillLight);

    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);

    const resetCamera = () => {
      camera.position.set(
        boundingRadius * 2.7,
        boundingRadius * 2.1,
        boundingRadius * 3.1,
      );
      camera.near = Math.max(0.1, boundingRadius / 80);
      camera.far = boundingRadius * 20;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
    };

    resetViewRef.current = resetCamera;
    resetCamera();
    host.replaceChildren(renderer.domElement);

    const resize = () => {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    let animationFrame = 0;
    const render = () => {
      controls.update();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(render);
    };
    render();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      controls.dispose();
      meshGeometry.dispose();
      material.dispose();
      renderer.dispose();
      host.replaceChildren();
      resetViewRef.current = null;
    };
  }, [geometry, resetCount]);

  return (
    <div className="relative h-full min-h-80 w-full overflow-hidden rounded-lg border border-border-default bg-surface-sunken">
      <div ref={hostRef} className="h-full min-h-80 w-full" />
      <div className="absolute right-3 top-3">
        <Button
          aria-label="Reset preview view"
          variant="secondary"
          onClick={() => {
            if (resetViewRef.current) {
              resetViewRef.current();
            } else {
              setResetCount((count) => count + 1);
            }
          }}
        >
          <RotateCcw data-icon aria-hidden="true" />
          Reset view
        </Button>
      </div>
    </div>
  );
}

function threeColorFromToken(value: string) {
  const trimmed = value.trim();
  const hslMatch = trimmed.match(
    /^hsl\(\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*[\d.]+)?\s*\)$/u,
  );
  const rawMatch = trimmed.match(/^([\d.]+)\s+([\d.]+)%\s+([\d.]+)%$/u);
  const match = hslMatch ?? rawMatch;

  if (!match) {
    return new THREE.Color().setHSL(0, 0, 0);
  }

  return new THREE.Color().setHSL(
    Number(match[1]) / 360,
    Number(match[2]) / 100,
    Number(match[3]) / 100,
  );
}
