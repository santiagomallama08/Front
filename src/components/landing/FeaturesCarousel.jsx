import React from "react";
import Slider from "react-slick";
import {
  FaCloudUploadAlt,
  FaBrain,
  FaRulerVertical,
  FaCube,
  FaEye,
} from "react-icons/fa";
import { MdArrowBackIos, MdArrowForwardIos } from "react-icons/md";

const features = [
  {
    icon: <FaCloudUploadAlt size={40} />,
    title: "Carga de estudios",
    desc: "Sube carpetas DICOM completas y recórrelas frame a frame.",
  },
  {
    icon: <FaBrain size={40} />,
    title: "Segmentación automática",
    desc: "Segmenta en tiempo real y obtén máscaras precisas.",
  },
  {
    icon: <FaRulerVertical size={40} />,
    title: "Medidas anatómicas",
    desc: "Calcula volumen, longitud, área y más.",
  },
  {
    icon: <FaCube size={40} />,
    title: "Modelado STL",
    desc: "Exporta estructuras segmentadas en formato STL.",
  },
  {
    icon: <FaEye size={40} />,
    title: "Visualización 3D",
    desc: "Visualiza tus resultados en 3D dentro del navegador.",
  },
];

const ArrowLeft = ({ onClick }) => (
  <div
    className="absolute -left-6 top-1/2 transform -translate-y-1/2 
               z-10 cursor-pointer text-gray-500 hover:text-[#B01FFF] transition"
    onClick={onClick}
  >
    <MdArrowBackIos size={28} />
  </div>
);

const ArrowRight = ({ onClick }) => (
  <div
    className="absolute -right-6 top-1/2 transform -translate-y-1/2 
               z-10 cursor-pointer text-gray-500 hover:text-[#B01FFF] transition"
    onClick={onClick}
  >
    <MdArrowForwardIos size={28} />
  </div>
);

const FeaturesCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 3,
    slidesToScroll: 1,
    centerMode: true,
    centerPadding: "120px",
    autoplay: true,
    autoplaySpeed: 2500,
    nextArrow: <ArrowRight />,
    prevArrow: <ArrowLeft />,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 1,
          centerPadding: "80px",
        },
      },
      {
        breakpoint: 640,
        settings: {
          slidesToShow: 1,
          centerPadding: "30px",
        },
      },
    ],
  };

  return (
    <section className="feature-carousel py-20 bg-white relative">
      <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
        ¿Qué puedes hacer aquí?
      </h2>

      <div className="max-w-7xl mx-auto px-4 relative">
        <Slider {...settings}>
          {features.map((f, i) => (
            <div key={i} className="px-4">

              {/* ========== CARD CON HALO MORADO SUAVE (PERFECTO) ========== */}
              <div
                className="
                  group relative flex flex-col items-center justify-center
                  rounded-2xl p-8 text-center h-80

                  bg-[#0A0A0A]
                  bg-[radial-gradient(circle_at_top,rgba(176,31,255,0.25)_0%,rgba(0,0,0,0)_70%)]

                  border border-[rgba(176,31,255,0.25)]
                  shadow-[0_0_20px_rgba(176,31,255,0.15)]

                  transition-all duration-300
                  hover:shadow-[0_0_35px_rgba(176,31,255,0.35)]
                  hover:-translate-y-2
                  overflow-hidden
                "
              >
                {/* Ícono */}
                <div className="relative z-20 text-[#B01FFF] mb-4">
                  {f.icon}
                </div>

                {/* Título */}
                <h3 className="relative z-20 text-white font-semibold text-xl mb-2">
                  {f.title}
                </h3>

                {/* Descripción */}
                <p className="relative z-20 text-gray-300 text-sm">
                  {f.desc}
                </p>
              </div>

            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
