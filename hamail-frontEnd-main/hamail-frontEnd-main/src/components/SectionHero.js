"use client";
import Container from "./Container";

export default function SectionHero({ title }) {
  return (
    <div
      className="relative h-[20vh] md:h-[30vh] bg-gradient-to-b from-primary/90 via-primary/60 
    to-third overflow-hidden"
    >
      {/* Animated Curved Shapes */}
      <div className="absolute inset-0">
        <svg
          className="absolute top-0 left-0 w-full h-full opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            className="animate-float-slow"
            d="M0,50 C20,40 40,60 60,50 C80,40 100,60 100,50 L100,100 L0,100 Z"
            fill="white"
          />
        </svg>
        <svg
          className="absolute top-0 right-0 w-full h-full opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            className="animate-float-slower"
            d="M100,30 C80,20 60,40 40,30 C20,20 0,40 0,30 L0,100 L100,100 Z"
            fill="white"
          />
        </svg>
        <svg
          className="absolute bottom-0 left-0 w-full h-full opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            className="animate-float-slowest"
            d="M0,70 C20,60 40,80 60,70 C80,60 100,80 100,70 L100,100 L0,100 Z"
            fill="white"
          />
        </svg>
      </div>
      <div
        className="absolute inset-0 bg-cover 
      bg-center mix-blend-overlay opacity-20"
      ></div>
      <Container
        maxWidth="7xl"
        className="relative h-full flex flex-col justify-center items-center text-center"
      >
        <h3 className="text-black mb-4 md:mb-6 mt-20 md:mt-18">{title}</h3>
      </Container>
    </div>
  );
}
