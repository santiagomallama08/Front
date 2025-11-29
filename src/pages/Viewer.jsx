// src/pages/Viewer.jsx
import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SegmentResult from '../components/dicom/SegmentResult';
import { userHeaders } from '../utils/authHeaders';
import Swal from 'sweetalert2';

// 🔥 SOLO CAMBIADO ESTO
const API_BASE_URL = import.meta.env.VITE_API_URL;

const INITIAL_VIEWER_STATE = {
  zoom: 1.0,
  windowWidth: 1500,
  windowLevel: -500,
  rotation: 0,
};

const SWAL_DARK_CONFIG = {
  background: '#1f2937',
  color: '#fff',
};

export default function Viewer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [segmentacion, setSegmentacion] = useState(null);
  const [loadingSegment, setLoadingSegment] = useState(false);
  const [loading3D, setLoading3D] = useState(false);
  const [progressSegment, setProgressSegment] = useState(0);
  const [progress3D, setProgress3D] = useState(0);

  const { session_id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [images, setImages] = useState(location.state?.images || []);
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(INITIAL_VIEWER_STATE.zoom);
  const [windowWidth, setWindowWidth] = useState(INITIAL_VIEWER_STATE.windowWidth);
  const [windowLevel, setWindowLevel] = useState(INITIAL_VIEWER_STATE.windowLevel);
  const [rotation, setRotation] = useState(INITIAL_VIEWER_STATE.rotation);
  const [isDragging, setIsDragging] = useState(false);
  const [preset, setPreset] = useState("auto");
  const [thrMin, setThrMin] = useState("");
  const [thrMax, setThrMax] = useState("");

  const dragStart = useRef({ x: 0, y: 0 });

  const imageUrl = useMemo(
    () => (images.length ? `${API_BASE_URL}${images[current]}` : null),
    [images, current]
  );

  const goBack = useCallback(() => {
    const source = location.state?.source;
    if (source === 'historial') return navigate('/historial');
    if (source === 'upload') return navigate('/upload');
    return navigate(-1);
  }, [location.state?.source, navigate]);

  const simulateProgress = useCallback((setProgress, increment, interval) => {
    return new Promise((resolve) => {
      let progress = 0;
      const timer = setInterval(() => {
        progress += Math.random() * increment;
        if (progress >= 90) {
          clearInterval(timer);
          setProgress(90);
          resolve();
        } else {
          setProgress(progress);
        }
      }, interval);
    });
  }, []);

  const simulateProgress2D = useCallback(
    () => simulateProgress(setProgressSegment, 20, 150),
    [simulateProgress]
  );

  const simulateProgress3D = useCallback(
    () => simulateProgress(setProgress3D, 12, 200),
    [simulateProgress]
  );

  const eliminarImagen = useCallback(
    async (index) => {
      const result = await Swal.fire({
        title: "Eliminar imagen",
        text: "¿Estás seguro de eliminar esta imagen de la serie?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Eliminar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#d33",
        ...SWAL_DARK_CONFIG,
      });

      if (!result.isConfirmed) return;

      setImages((prev) => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });

      setCurrent((prev) => Math.max(0, Math.min(prev, images.length - 2)));
    },
    [images.length]
  );

  const segmentarImagen = useCallback(async () => {
    if (!session_id || !images[current]) return;

    setLoadingSegment(true);
    setProgressSegment(0);

    try {
      const form = new FormData();
      form.append("session_id", session_id);
      const imageName = images[current].split("/").pop();
      form.append("image_name", imageName);

      const [data] = await Promise.all([
        fetch(`${API_BASE_URL}/segmentar-desde-mapping/`, {
          method: "POST",
          headers: { ...userHeaders() },
          body: form,
        }).then((res) => res.json()),
        simulateProgress2D(),
      ]);

      setProgressSegment(100);

      setTimeout(() => {
        setSegmentacion(data);
        setIsModalOpen(true);
      }, 300);
    } catch (error) {
      console.error("Error:", error);
      setProgressSegment(0);
    } finally {
      setLoadingSegment(false);
    }
  }, [session_id, images, current, simulateProgress2D]);

  const segmentarSerie3D = useCallback(async () => {
    setLoading3D(true);
    setProgress3D(0);

    try {
      const form = new FormData();
      form.append("session_id", session_id);

      if (preset !== "auto") form.append("preset", preset);
      if (preset === "custom") {
        if (thrMin !== "") form.append("thr_min", String(thrMin));
        if (thrMax !== "") form.append("thr_max", String(thrMax));
      }

      const [res] = await Promise.all([
        fetch(`${API_BASE_URL}/segmentar-serie-3d/`, {
          method: "POST",
          headers: userHeaders(),
          body: form,
        }),
        simulateProgress3D(),
      ]);

      const data = await res.json();
      setProgress3D(100);

      if (!res.ok) throw new Error(data?.error || "Falló la segmentación 3D");

      await Swal.fire({
        icon: data?.warning ? "warning" : "success",
        title: data?.warning ? "Sin voxeles" : "Segmentación 3D lista",
        text: data?.message || "Segmentación completada",
        ...SWAL_DARK_CONFIG,
        confirmButtonColor: "#3b82f6",
      });

      navigate(`/segmentaciones/${session_id}`);
    } catch (e) {
      setProgress3D(0);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: e.message,
        ...SWAL_DARK_CONFIG,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading3D(false);
    }
  }, [session_id, preset, thrMin, thrMax, simulateProgress3D, navigate]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        setWindowWidth((prev) => Math.max(100, prev + deltaY * 2));
      } else {
        setWindowLevel((prev) => prev + deltaX * 2);
      }

      dragStart.current = { x: e.clientX, y: e.clientY };
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const imageStyle = useMemo(
    () => ({
      maxWidth: "100%",
      maxHeight: "100%",
      objectFit: "contain",
      filter: `brightness(${windowWidth / 1000}) contrast(${(windowLevel + 1000) / 1000})`,
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      pointerEvents: "none",
    }),
    [windowWidth, windowLevel, zoom, rotation]
  );

  const viewerStyle = useMemo(
    () => ({
      width: "min(90vw, 1200px)",
      height: "min(60vh, 600px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: isDragging ? "grabbing" : "grab",
    }),
    [isDragging]
  );

  const ProgressBar = useCallback(
    ({ progress, label }) => (
      <div className="w-full max-w-md mb-4 sm:mb-6 px-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium text-gray-300">{label}</span>
          <span className="text-xs sm:text-sm font-semibold text-purple-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5 sm:h-3 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] h-2.5 sm:h-3 rounded-full transition-all duration-300 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>
    ),
    []
  );

  if (!session_id || !images.length) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center bg-gray-800 border border-gray-700 rounded-xl p-8 sm:p-12 shadow-lg">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="mb-6 text-gray-300 text-sm sm:text-base">No se encontraron imágenes válidas.</p>
          <button
            onClick={() => navigate('/upload')}
            className="bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90 text-white px-6 py-3 rounded-lg font-semibold transition-opacity shadow-lg"
          >
            Volver a subir ZIP
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center relative px-4 sm:px-6 py-6 sm:py-8"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        onClick={goBack}
        className="absolute top-3 left-3 sm:top-4 sm:left-4 p-2 sm:p-2.5 text-white bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] rounded-full shadow-lg hover:opacity-90 transition-opacity z-10"
      >
        <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
      </button>

      <div
        className="overflow-hidden rounded-lg sm:rounded-xl shadow-2xl mb-4 sm:mb-6 border border-gray-700 bg-black"
        style={viewerStyle}
        onMouseDown={handleMouseDown}
      >
        <img
          src={imageUrl}
          alt={`Frame ${current}`}
          style={imageStyle}
        />
      </div>

      <div className="w-full max-w-2xl flex flex-col items-center mb-4 sm:mb-6 px-2">
        <input
          type="range"
          min="0"
          max={images.length - 1}
          value={current}
          onChange={(e) => setCurrent(Number(e.target.value))}
          className="w-full accent-blue-500 cursor-pointer"
        />
        <div className="mt-2 text-xs sm:text-sm text-gray-300 font-medium">
          {`Imagen ${current + 1} / ${images.length}`}
        </div>

        <button
          onClick={() => eliminarImagen(current)}
          className="mt-3 sm:mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors text-sm sm:text-base font-medium"
        >
          🗑 Eliminar esta imagen
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 w-full max-w-5xl px-2">
        <div className="flex flex-col items-center">
          <label className="text-xs sm:text-sm text-gray-400 mb-2 font-medium">🔆 Brillo</label>
          <input
            type="range"
            min="500"
            max="2500"
            step="10"
            value={windowWidth}
            onChange={(e) => setWindowWidth(Number(e.target.value))}
            className="w-full max-w-[160px] accent-yellow-500 cursor-pointer"
          />
          <span className="text-xs text-gray-500 mt-1">{windowWidth}</span>
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs sm:text-sm text-gray-400 mb-2 font-medium">🌑 Contraste</label>
          <input
            type="range"
            min="-1000"
            max="1000"
            step="10"
            value={windowLevel}
            onChange={(e) => setWindowLevel(Number(e.target.value))}
            className="w-full max-w-[160px] accent-gray-400 cursor-pointer"
          />
          <span className="text-xs text-gray-500 mt-1">{windowLevel}</span>
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs sm:text-sm text-gray-400 mb-2 font-medium">🔍 Zoom</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full max-w-[160px] accent-purple-500 cursor-pointer"
          />
          <span className="text-xs text-gray-500 mt-1">{zoom.toFixed(1)}x</span>
        </div>

        <div className="flex flex-col items-center">
          <label className="text-xs sm:text-sm text-gray-400 mb-2 font-medium">↻ Rotar</label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full max-w-[160px] accent-blue-500 cursor-pointer"
          />
          <span className="text-xs text-gray-500 mt-1">{rotation}°</span>
        </div>
      </div>

      {loadingSegment && (
        <ProgressBar progress={progressSegment} label="Segmentando imagen 2D..." />
      )}

      {loading3D && (
        <ProgressBar progress={progress3D} label="Segmentando serie 3D..." />
      )}

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-2xl px-2">
        <button
          onClick={segmentarImagen}
          disabled={loadingSegment}
          className={`w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold rounded-lg shadow-lg transition-all text-sm sm:text-base ${
            loadingSegment
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90"
          }`}
        >
          {loadingSegment ? "Segmentando..." : "Segmentar esta imagen"}
        </button>

        <button
          onClick={segmentarSerie3D}
          disabled={loading3D}
          className={`w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-white font-semibold rounded-lg shadow-lg transition-all text-sm sm:text-base ${
            loading3D
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-[#007AFF] via-[#C633FF] to-[#FF4D00] hover:opacity-90"
          }`}
        >
          {loading3D ? "Procesando 3D..." : "Segmentar serie (3D)"}
        </button>
      </div>

      <SegmentResult
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        segmentacion={segmentacion}
      />
    </div>
  );
}
