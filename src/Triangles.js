import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Instances, Instance, Bvh, Wireframe, Environment } from "@react-three/drei";
import { EffectComposer, N8AO, SMAA, Bloom } from "@react-three/postprocessing";
import { useControls } from "leva";
import React, { useRef, useEffect } from "react";

export default function Triangles() {
  const rfs = THREE.MathUtils.randFloatSpread;
  const Geo = new THREE.TetrahedronGeometry(1);
  const Mat = new THREE.MeshBasicMaterial({
    color: "black",
    roughness: 0,
    envMapIntensity: 1,
    wireframe: false,
  });

  const pyramidRef = useRef();

  // Scroll effect to move and rotate the pyramid
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY; // get scroll position
      if (pyramidRef.current) {
        // Adjust the pyramid position and rotation based on scroll
        pyramidRef.current.rotation.y = scrollPosition * 0.01;
        pyramidRef.current.position.y = -scrollPosition * 0.01; // Moves up or down
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Empty dependency array so this only runs once when component mounts

  function Clump({ mat = new THREE.Matrix4(), vec = new THREE.Vector3(), ...props }) {
    const randomVector = (r) => [r / 2 - Math.random() * r, r / 2 - Math.random() * r, r / 2 - Math.random() * r];
    const randomEuler = () => [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI];
    const { radius } = useControls({ radius: { value: 10, min: 0, max: 30, step: 0.1 } });
    const { power } = useControls({ power: { value: 1, min: 0, max: 30, step: 0.1 } });
    const data = Array.from({ length: 1000 }, (r = radius) => ({ random: Math.random(), position: randomVector(r), rotation: randomEuler(), randomVector: randomVector(r), radius: radius, power: power }));

    const { range } = useControls({ range: { value: 5000, min: 0, max: 60000, step: 10 } });
    let positions = [rfs(radius), rfs(radius), rfs(radius)];
    let scale = (Math.abs(positions[0]) + Math.abs(positions[1]) + Math.abs(positions[2])) / 3;
    const { outlines } = useControls({ outlines: { value: 0.07, step: 0.01, min: 0, max: 0.2 } });

    return (
      <Instances range={range} castShadow receiveShadow args={[Geo, Mat, 100000]}>
        {data.map((props, i) => (
          <Shoe key={i} {...props} />
        ))}
        <Wireframe thickness={outlines} stroke={"#fff"} />
      </Instances>
    );
  }

  function EasingFunction(x) {
    return x * x * x;
  }

  function Shoe({ random, color = new THREE.Color(), ...props }) {
    const ref = React.useRef();
    const [hovered, setHover] = React.useState(false);
    useFrame((state) => {
      const t = state.clock.getElapsedTime() + random * 10000;
      ref.current.rotation.set(Math.cos(t / 4) / 2, Math.sin(t / 4) / 2, Math.cos(t / 1.5) / 2);
      ref.current.position.y = Math.sin(t / 1.5) / 4;
      ref.current.color.lerp(color.set(hovered ? 'red' : 'white'), hovered ? 1 : 0.1);
      ref.current.scale.x = ref.current.scale.y = ref.current.scale.z = EasingFunction(1 - (ref.current.position.distanceTo(new THREE.Vector3())) / props.radius) ** props.power;
    });

    return (
      <group {...props}>
        <Instance ref={ref} position={props.randomVector} onPointerOver={(e) => (e.stopPropagation(), setHover(true))} onPointerOut={(e) => setHover(false)} />
      </group>
    );
  }

  return (
    <React.Fragment>
      <Canvas
        shadows
        gl={{ antialias: false }}
        dpr={[1, 1.5]}
        camera={{ position: [-2, -12, 25], fov: 50, near: 1, far: 400, rotation: [THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(0), THREE.MathUtils.degToRad(270)] }}
        className="z-2"
      >
        <ambientLight intensity={0.5} />
        <color attach="background" args={["#010101"]} />
        <spotLight
          intensity={1}
          angle={0.2}
          penumbra={1}
          position={[30, 30, 30]}
          castShadow
          shadow-mapSize={[512, 512]}
        />
        <Bvh firstHitOnly>
          <Clump />
        </Bvh>
        <Environment files="/adamsbridge.hdr" />
        <EffectComposer disableNormalPass multisampling={0}>
          <N8AO
            halfRes
            color="black"
            aoRadius={2}
            intensity={1}
            aoSamples={6}
            denoiseSamples={4}
          />
          <Bloom mipmapBlur levels={7} intensity={1} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </React.Fragment>
  );
}
