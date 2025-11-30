// src/pages/Modelado3D.jsx
import React, { useRef, useEffect, useState } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { STLExporter } from "three/examples/jsm/exporters/STLExporter";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function Modelado3D() {
  const mountRef = useRef(null);

  const [renderer, setRenderer] = useState(null);
  const [scene, setScene] = useState(null);
  const [camera, setCamera] = useState(null);
  const [controls, setControls] = useState(null);
  const [currentMesh, setCurrentMesh] = useState(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [selectionMarkers, setSelectionMarkers] = useState([]);
  const [selectionLines, setSelectionLines] = useState([]);

  const [modelDimensions, setModelDimensions] = useState(null);

  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  // --------------------------------------------------------------------
  // 1. Inicializar escena - CÁMARA Y CONTROLES MEJORADOS
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const _scene = new THREE.Scene();
    _scene.background = new THREE.Color("#0f0f0f");

    // ✅ CÁMARA PROFESIONAL - Vista óptima para trabajo médico
    const _camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 5000);
    _camera.position.set(100, 90, 130);

    const _renderer = new THREE.WebGLRenderer({ antialias: true });
    _renderer.setSize(width, height);
    _renderer.setPixelRatio(window.devicePixelRatio);

    mountRef.current.appendChild(_renderer.domElement);

    // ✅ ILUMINACIÓN PROFESIONAL - Simula ambiente quirúrgico
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    _scene.add(ambient);

    // Luz principal (simula luz cenital quirúrgica)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(60, 100, 50);
    keyLight.castShadow = false;
    _scene.add(keyLight);

    // Luz de relleno frontal
    const fillLight = new THREE.DirectionalLight(0xe8f4ff, 0.6);
    fillLight.position.set(-40, 60, 80);
    _scene.add(fillLight);

    // Luz trasera para definir bordes
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, 30, -70);
    _scene.add(rimLight);

    // Luz inferior suave para eliminar sombras duras
    const bottomLight = new THREE.DirectionalLight(0xb8d4ff, 0.3);
    bottomLight.position.set(0, -40, 0);
    _scene.add(bottomLight);

    // ✅ CONTROLES MEJORADOS - Experiencia fluida y profesional
    const _controls = new OrbitControls(_camera, _renderer.domElement);
    _controls.enableDamping = true;
    _controls.dampingFactor = 0.08;
    _controls.enablePan = true;
    _controls.panSpeed = 1.2;
    _controls.zoomSpeed = 1.3;
    _controls.rotateSpeed = 0.6;
    _controls.minDistance = 40;
    _controls.maxDistance = 450;
    _controls.screenSpacePanning = true;
    _controls.target.set(0, 0, 0);
    _controls.maxPolarAngle = Math.PI * 0.95; // Evita que la cámara pase por debajo

    setScene(_scene);
    setCamera(_camera);
    setRenderer(_renderer);
    setControls(_controls);

    const animate = () => {
      requestAnimationFrame(animate);
      _controls.update();
      _renderer.render(_scene, _camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const newWidth = mountRef.current.clientWidth;
      const newHeight = mountRef.current.clientHeight;
      _renderer.setSize(newWidth, newHeight);
      _camera.aspect = newWidth / newHeight;
      _camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (mountRef.current && _renderer.domElement?.parentNode) {
        mountRef.current.removeChild(_renderer.domElement);
      }
      _renderer.dispose();
    };
  }, []);

  // --------------------------------------------------------------------
  // 2. Limpiar selección
  // --------------------------------------------------------------------
  const clearSelection = () => {
    if (scene) {
      selectionMarkers.forEach(m => {
        scene.remove(m);
        if (m.geometry) m.geometry.dispose();
        if (m.material) m.material.dispose();
      });

      selectionLines.forEach(l => {
        scene.remove(l);
        if (l.geometry) l.geometry.dispose();
        if (l.material) l.material.dispose();
      });
    }

    setSelectedPoints([]);
    setSelectionMarkers([]);
    setSelectionLines([]);
  };

  // --------------------------------------------------------------------
  // 3. Selector con puntos milimétricos y líneas conectadas
  // --------------------------------------------------------------------
  const handleCanvasClick = (event) => {
    if (!selectionMode || !currentMesh || !camera || !scene) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.current.setFromCamera(mouse.current, camera);
    const hits = raycaster.current.intersectObject(currentMesh);
    if (!hits.length) return;

    const point = hits[0].point.clone();
    const updatedPoints = [...selectedPoints, point];
    setSelectedPoints(updatedPoints);

    // 🔴 Marcador pequeño y preciso
    const markerGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      depthTest: false
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.copy(point);
    marker.renderOrder = 999;
    scene.add(marker);
    setSelectionMarkers(prev => [...prev, marker]);

    // 🟡 Línea amarilla entre puntos consecutivos
    if (updatedPoints.length > 1) {
      const prevPoint = updatedPoints[updatedPoints.length - 2];
      const lineGeometry = new THREE.BufferGeometry().setFromPoints([prevPoint, point]);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffff00,
        linewidth: 2,
        depthTest: false,
        transparent: true,
        opacity: 0.9
      });
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.renderOrder = 998;
      scene.add(line);
      setSelectionLines(prev => [...prev, line]);
    }

    // 🟢 Línea verde de cierre
    if (updatedPoints.length >= 3) {
      const oldClosingLines = selectionLines.filter(l => l.userData?.closing);
      oldClosingLines.forEach(l => {
        scene.remove(l);
        if (l.geometry) l.geometry.dispose();
        if (l.material) l.material.dispose();
      });

      const closingGeometry = new THREE.BufferGeometry().setFromPoints([
        updatedPoints[updatedPoints.length - 1],
        updatedPoints[0]
      ]);
      const closingMaterial = new THREE.LineBasicMaterial({
        color: 0x00ff00,
        linewidth: 3,
        depthTest: false,
        transparent: true,
        opacity: 0.95
      });
      const closingLine = new THREE.Line(closingGeometry, closingMaterial);
      closingLine.userData.closing = true;
      closingLine.renderOrder = 998;
      scene.add(closingLine);

      setSelectionLines(prev => [
        ...prev.filter(l => !l.userData?.closing),
        closingLine
      ]);
    }
  };

  // --------------------------------------------------------------------
  // ✅ SELECCIÓN ULTRA PRECISA - SOLO SUPERFICIE EXACTA VISIBLE
  // --------------------------------------------------------------------
  const getFacesInSelection = (mesh, points) => {
    if (points.length < 3) return new Set();

    const geometry = mesh.geometry;
    const positions = geometry.attributes.position.array;
    const selectedFaces = new Set();

    // Centro del polígono de selección
    const center = new THREE.Vector3();
    points.forEach(p => center.add(p));
    center.divideScalar(points.length);

    // ✅ Vector de vista EXACTO desde cámara
    camera.updateMatrixWorld();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.negate(); // Invertir para apuntar hacia donde mira la cámara

    // Sistema de coordenadas de la cámara
    const cameraRight = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const cameraUp = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);

    // Proyectar puntos de selección a 2D (plano de la cámara)
    const polygon2D = points.map(p => {
      const rel = new THREE.Vector3().subVectors(p, center);
      return new THREE.Vector2(rel.dot(cameraRight), rel.dot(cameraUp));
    });

    // Bounds del polígono (sin margen extra)
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    polygon2D.forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    // Función punto en polígono (Ray Casting)
    const isPointInPolygon = (point2D, polygon) => {
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        const intersect = ((yi > point2D.y) !== (yj > point2D.y)) &&
          (point2D.x < (xj - xi) * (point2D.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // ✅ PLANO DE SELECCIÓN - Definido por los puntos seleccionados
    const selectionPlaneNormal = cameraDirection.clone().normalize();
    const selectionPlaneConstant = -selectionPlaneNormal.dot(center);

    // Radio máximo del polígono (para filtro de distancia)
    let maxRadius = 0;
    points.forEach(p => {
      const dist = center.distanceTo(p);
      if (dist > maxRadius) maxRadius = dist;
    });

    // Distancia promedio de puntos seleccionados a la cámara
    let avgDistance = 0;
    points.forEach(p => {
      avgDistance += camera.position.distanceTo(p);
    });
    avgDistance /= points.length;

    // ✅ TOLERANCIA DINÁMICA basada en tamaño de selección
    const depthTolerance = Math.max(5, maxRadius * 0.3);

    // Verificar cada cara del modelo
    for (let i = 0; i < positions.length / 9; i++) {
      // Obtener vértices de la cara
      const v1 = new THREE.Vector3(positions[i * 9], positions[i * 9 + 1], positions[i * 9 + 2]);
      const v2 = new THREE.Vector3(positions[i * 9 + 3], positions[i * 9 + 4], positions[i * 9 + 5]);
      const v3 = new THREE.Vector3(positions[i * 9 + 6], positions[i * 9 + 7], positions[i * 9 + 8]);

      // Aplicar transformación del mesh
      v1.applyMatrix4(mesh.matrixWorld);
      v2.applyMatrix4(mesh.matrixWorld);
      v3.applyMatrix4(mesh.matrixWorld);

      // Centro de la cara
      const faceCenter = new THREE.Vector3()
        .add(v1).add(v2).add(v3)
        .divideScalar(3);

      // ✅ FILTRO 1: Distancia al centro de selección
      const distToCenter = faceCenter.distanceTo(center);
      if (distToCenter > maxRadius * 1.8) continue; // Rechazar caras muy lejanas

      // ✅ FILTRO 2: Normal de la cara - debe mirar hacia la cámara
      const edge1 = new THREE.Vector3().subVectors(v2, v1);
      const edge2 = new THREE.Vector3().subVectors(v3, v1);
      const faceNormal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
      
      const viewAngle = faceNormal.dot(cameraDirection);
      if (viewAngle > 0.2) continue; // Rechazar caras que NO miran hacia la cámara

      // ✅ FILTRO 3: Profundidad - solo caras en el plano de selección
      const faceDistance = camera.position.distanceTo(faceCenter);
      const depthDiff = Math.abs(faceDistance - avgDistance);
      if (depthDiff > depthTolerance) continue; // Rechazar caras detrás/delante

      // ✅ FILTRO 4: Verificar oclusión con Raycaster
      raycaster.current.set(camera.position, 
        new THREE.Vector3().subVectors(faceCenter, camera.position).normalize()
      );
      const intersects = raycaster.current.intersectObject(mesh);
      if (intersects.length > 0) {
        const firstHit = intersects[0].point;
        const distToFirstHit = camera.position.distanceTo(firstHit);
        const distToFace = camera.position.distanceTo(faceCenter);
        
        // Si hay algo delante de esta cara, descartarla
        if (distToFirstHit < distToFace - 2) continue;
      }

      // ✅ FILTRO 5: Proyección 2D - dentro del polígono
      const relPos = new THREE.Vector3().subVectors(faceCenter, center);
      const point2D = new THREE.Vector2(
        relPos.dot(cameraRight),
        relPos.dot(cameraUp)
      );

      // Quick bounds check
      if (point2D.x < minX || point2D.x > maxX ||
          point2D.y < minY || point2D.y > maxY) {
        continue;
      }

      // Verificar si está dentro del polígono
      if (isPointInPolygon(point2D, polygon2D)) {
        selectedFaces.add(i);
      }
    }

    return selectedFaces;
  };

  // --------------------------------------------------------------------
  // Exportación STL - CORREGIDA
  // --------------------------------------------------------------------
  const exportSelected = () => {
    if (!currentMesh || selectedPoints.length < 3) {
      alert("Selecciona al menos 3 puntos para definir el área.");
      return;
    }

    const selectedFaces = getFacesInSelection(currentMesh, selectedPoints);

    if (selectedFaces.size === 0) {
      alert("No se encontraron caras en el área seleccionada. Intenta con más puntos o un área más grande.");
      return;
    }

    const geometry = currentMesh.geometry;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal ? geometry.attributes.normal.array : null;

    const selectedPositions = [];
    const selectedNormals = [];

    const transformMatrix = new THREE.Matrix4();
    transformMatrix.compose(
      currentMesh.position,
      currentMesh.quaternion,
      currentMesh.scale
    );

    selectedFaces.forEach(faceIndex => {
      for (let j = 0; j < 3; j++) {
        const idx = faceIndex * 9 + j * 3;

        const vertex = new THREE.Vector3(
          positions[idx],
          positions[idx + 1],
          positions[idx + 2]
        );
        vertex.applyMatrix4(transformMatrix);
        selectedPositions.push(vertex.x, vertex.y, vertex.z);

        if (normals) {
          const normal = new THREE.Vector3(
            normals[idx],
            normals[idx + 1],
            normals[idx + 2]
          );
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(transformMatrix);
          normal.applyMatrix3(normalMatrix).normalize();
          selectedNormals.push(normal.x, normal.y, normal.z);
        }
      }
    });

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(selectedPositions, 3));

    if (selectedNormals.length > 0) {
      newGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(selectedNormals, 3));
    }

    newGeometry.computeVertexNormals();

    const tempMesh = new THREE.Mesh(
      newGeometry,
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );

    const exporter = new STLExporter();
    const stlString = exporter.parse(tempMesh, { binary: false });

    const blob = new Blob([stlString], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "protesis_seleccionada.stl";
    a.click();
    URL.revokeObjectURL(a.href);

    tempMesh.geometry.dispose();
    tempMesh.material.dispose();

    alert(`✓ Prótesis exportada exitosamente!\n\n${selectedFaces.size} caras exportadas\n${selectedPoints.length} puntos de referencia\n\nArchivo: protesis_seleccionada.stl`);
  };

  // --------------------------------------------------------------------
  // Eliminar Modelo
  // --------------------------------------------------------------------
  const removeModel = () => {
    clearSelection();
    if (currentMesh && scene) {
      scene.remove(currentMesh);
      if (currentMesh.geometry) currentMesh.geometry.dispose();
      if (currentMesh.material) currentMesh.material.dispose();
      setCurrentMesh(null);
    }
    setModelDimensions(null);
  };

  // --------------------------------------------------------------------
  // Cargar STL - CON AJUSTE AUTOMÁTICO DE CÁMARA
  // --------------------------------------------------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !scene) return;

    const loader = new STLLoader();
    const reader = new FileReader();

    reader.onload = (ev) => {
      const geometry = loader.parse(ev.target.result);
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();

      const bbox = geometry.boundingBox;
      const sizeVector = bbox.getSize(new THREE.Vector3());
      const size = sizeVector.length();

      geometry.center();

      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({
          color: 0xf5f5f5,
          roughness: 0.7,
          metalness: 0.1,
          flatShading: false,
          side: THREE.FrontSide
        })
      );

      mesh.rotation.x = -Math.PI / 2;
      mesh.scale.setScalar(80 / size);

      if (currentMesh) {
        scene.remove(currentMesh);
      }
      scene.add(mesh);

      setCurrentMesh(mesh);
      clearSelection();

      setModelDimensions({
        width: (bbox.max.x - bbox.min.x).toFixed(2),
        height: (bbox.max.y - bbox.min.y).toFixed(2),
        depth: (bbox.max.z - bbox.min.z).toFixed(2),
        size: size.toFixed(2)
      });

      // ✅ AJUSTE AUTOMÁTICO DE CÁMARA - Encuadre perfecto
      if (controls && camera) {
        controls.target.set(0, 0, 0);
        
        const fov = camera.fov * (Math.PI / 180);
        const maxDim = Math.max(sizeVector.x, sizeVector.y, sizeVector.z) * (80 / size);
        const optimalDistance = (maxDim / Math.tan(fov / 2)) * 1.5;
        
        // Posición con mejor ángulo de vista (ligeramente superior frontal)
        const angle = Math.PI / 3.5;
        const elevation = 0.65;
        
        camera.position.set(
          optimalDistance * Math.cos(angle),
          optimalDistance * elevation,
          optimalDistance * Math.sin(angle)
        );
        
        camera.lookAt(0, 0, 0);
        controls.update();
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // --------------------------------------------------------------------
  // Listener
  // --------------------------------------------------------------------
  useEffect(() => {
    if (!renderer || !controls) return;

    const canvas = renderer.domElement;

    if (selectionMode) {
      controls.enabled = true;
    }

    canvas.addEventListener("click", handleCanvasClick);

    return () => canvas.removeEventListener("click", handleCanvasClick);
  }, [renderer, controls, currentMesh, selectionMode, selectedPoints, selectionLines, scene, camera]);

  // --------------------------------------------------------------------
  // UI
  // --------------------------------------------------------------------
  return (
    <div className="p-4 text-gray-300 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-1">Modelado 3D</h1>
      <p className="mb-3 text-gray-400">
        Sube un modelo STL para visualizar el cráneo y seleccionar la prótesis con precisión milimétrica.
      </p>

      {/* BOTONES */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded cursor-pointer text-sm text-white">
          📁 Subir modelo STL
          <input type="file" accept=".stl" className="hidden" onChange={handleFileUpload} />
        </label>

        <button
          onClick={removeModel}
          disabled={!currentMesh}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:opacity-50 transition px-4 py-2 rounded text-sm text-white"
        >
          🗑️ Eliminar Modelo
        </button>

        <button
          onClick={() => setSelectionMode(!selectionMode)}
          disabled={!currentMesh}
          className={`px-4 py-2 rounded text-sm font-medium transition ${selectionMode ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"
            } ${!currentMesh ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {selectionMode ? "✓ Modo Selección ON" : "📍 Modo Selección OFF"}
        </button>

        <button
          onClick={clearSelection}
          disabled={selectedPoints.length === 0}
          className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-700 disabled:opacity-50 transition px-4 py-2 rounded text-sm text-white"
        >
          🧹 Limpiar ({selectedPoints.length})
        </button>

        <button
          onClick={exportSelected}
          disabled={selectedPoints.length < 3}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 transition px-4 py-2 rounded text-sm text-white font-medium"
        >
          💾 Exportar Prótesis ({selectedPoints.length})
        </button>
      </div>

      {/* Instrucciones */}
      <div className="text-xs text-gray-400 mb-3">
        🖱 <strong>Controles:</strong> Rotar: clic izquierdo + arrastrar · Zoom: scroll · Pan: clic derecho + arrastrar
        {selectionMode && (
          <span className="text-green-400 ml-2">
            · <strong>Modo Activo:</strong> Clic para marcar puntos | Rotar libremente con clic izquierdo
          </span>
        )}
      </div>

      {/* DIMENSIONES */}
      {modelDimensions && (
        <div className="mb-4 bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
          <h3 className="text-sm font-semibold mb-3 text-white">📏 Dimensiones del Modelo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-purple-900/30 border border-purple-500/30 px-3 py-2 rounded-lg">
              <span className="text-purple-400 font-semibold block mb-1">Ancho:</span>
              <span className="text-white font-bold">{modelDimensions.width} mm</span>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/30 px-3 py-2 rounded-lg">
              <span className="text-indigo-400 font-semibold block mb-1">Alto:</span>
              <span className="text-white font-bold">{modelDimensions.height} mm</span>
            </div>

            <div className="bg-blue-900/30 border border-blue-500/30 px-3 py-2 rounded-lg">
              <span className="text-blue-400 font-semibold block mb-1">Profundidad:</span>
              <span className="text-white font-bold">{modelDimensions.depth} mm</span>
            </div>

            <div className="bg-green-900/30 border border-green-500/30 px-3 py-2 rounded-lg">
              <span className="text-green-400 font-semibold block mb-1">Tamaño Total:</span>
              <span className="text-white font-bold">{modelDimensions.size} mm</span>
            </div>
          </div>
        </div>
      )}

      {/* VISOR 3D */}
      <div
        ref={mountRef}
        className="flex-1 min-h-[400px] bg-[#0f0f0f] border border-[#252525] rounded-md shadow-2xl"
        style={{ cursor: selectionMode ? 'crosshair' : 'grab' }}
      ></div>
    </div>
  );
}