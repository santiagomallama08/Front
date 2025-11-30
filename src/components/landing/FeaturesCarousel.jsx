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
               z-10 cursor-pointer text-gray-400 hover:text-[#00e5ff] transition"
    onClick={onClick}
  >
    <MdArrowBackIos size={28} />
  </div>
);

const ArrowRight = ({ onClick }) => (
  <div
    className="absolute -right-6 top-1/2 transform -translate-y-1/2 
               z-10 cursor-pointer text-gray-400 hover:text-[#00e5ff] transition"
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
              {/* CARD NEON */}
              <div
                className="
                  group relative flex flex-col items-center justify-center
                  rounded-2xl p-8 text-center h-80

                  bg-[#001014]               
                  border border-[#00e5ff50]
                  shadow-[0_0_15px_#00e5ff30]

                  transition-all duration-300
                  hover:shadow-[0_0_35px_#00e5ffA0]
                  hover:border-[#00e5ffA0]
                  hover:-translate-y-2
                  overflow-hidden
                "
              >
                {/* Glow interno */}
                <div className="
                    absolute inset-0 rounded-2xl blur-xl opacity-30
                    bg-[radial-gradient(circle,_rgba(0,229,255,0.6)_0%,_rgba(0,0,0,0)_70%)]
                " />

                {/* Glow externo */}
                <div className="
                    absolute inset-0 rounded-2xl blur-2xl opacity-25
                    bg-[radial-gradient(circle,_rgba(0,229,255,0.4)_0%,_rgba(0,0,0,0)_80%)]
                " />

                {/* Contenido */}
                <div className="relative z-10">
                  <div className="text-[#00e5ff] mb-4">{f.icon}</div>

                  <h3 className="text-white font-semibold text-xl mb-2">
                    {f.title}
                  </h3>

                  <p className="text-gray-300 text-sm">{f.desc}</p>
                </div>
              </div>

            </div>
          ))}
        </Slider>
      </div>
    </section>
  );
};

export default FeaturesCarousel;
