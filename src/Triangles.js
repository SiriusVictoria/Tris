import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Instances, Instance, Bvh, Wireframe, Environment } from "@react-three/drei";
import { EffectComposer, N8AO, SMAA, Bloom } from "@react-three/postprocessing";
import { useControls } from "leva";
import React, { useRef, useEffect } from "react";

export default function Triangles() {
  const pyramidRef = useRef();

  // Scroll effect to move and rotate the pyramid
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY; // Get scroll position
      if (pyramidRef.current) {
        pyramidRef.current.rotation.y = scrollPosition * 0.01;
        pyramidRef.current.position.y = -scrollPosition * 0.01;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  function Clump() {
    const Geo = new THREE.TetrahedronGeometry(1);
    const Mat = new THREE.MeshBasicMaterial({ color: "black" });
    const data = Array.from({ length: 100 }, () => ({
      position: [THREE.MathUtils.randFloatSpread(20), THREE.MathUtils.randFloatSpread(20), THREE.MathUtils.randFloatSpread(20)],
    }));

    return (
      <Instances range={100} geometry={Geo} material={Mat}>
        {data.map((props, i) => (
          <Instance key={i} position={props.position} />
        ))}
        <Wireframe thickness={0.1} stroke={"#fff"} />
      </Instances>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 20], fov: 50 }}
      ref={pyramidRef}
    >
      <ambientLight intensity={0.5} />
      <spotLight intensity={1} angle={0.3} position={[10, 10, 10]} />
      <Bvh>
        <Clump />
      </Bvh>
      <EffectComposer>
        <N8AO intensity={1} />
        <Bloom intensity={0.5} />
        <SMAA />
      </EffectComposer>
    </Canvas>
  );
}
