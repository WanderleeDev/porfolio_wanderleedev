import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Tipos de Matter.js
interface MatterBody {
  position: { x: number; y: number };
  angle: number;
  velocity: { x: number; y: number };
}

interface MatterEngine {
  world: any;
}

interface MatterModule {
  Engine: any;
  Render: any;
  Runner: any;
  World: any;
  Bodies: any;
  Body: any;
  Mouse: any;
  MouseConstraint: any;
}

interface ListItem {
  id: number;
  text: string;
  color: string;
  icon: string;
}

interface ItemPosition {
  x: number;
  y: number;
  rotation: number;
}

declare global {
  interface Window {
    Matter?: MatterModule;
  }
}

// Componente de física reutilizable
interface PhysicsListProps {
  items: ListItem[];
  title: string;
  gradient: string;
}

const PhysicsEngine: React.FC<PhysicsListProps> = ({
  items,
  title,
  gradient,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const runnerRef = useRef<any>(null);
  const bodiesRef = useRef<MatterBody[]>([]);
  const renderRef = useRef<any>(null);
  const animationRef = useRef<number>();

  const [itemPositions, setItemPositions] = useState<Map<number, ItemPosition>>(
    new Map()
  );
  const [isReady, setIsReady] = useState(false);

  const initPhysics = useCallback(() => {
    if (!window.Matter || !containerRef.current || engineRef.current) return;

    const Matter = window.Matter;
    const {
      Engine,
      Render,
      Runner,
      World,
      Bodies,
      Body,
      Mouse,
      MouseConstraint,
    } = Matter;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Crear engine
    const engine = Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 2;

    // Crear render
    const render = Render.create({
      element: containerRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio,
      },
    });
    renderRef.current = render;

    if (render.canvas) {
      render.canvas.style.position = "absolute";
      render.canvas.style.opacity = "0";
      render.canvas.style.pointerEvents = "auto";
      render.canvas.style.zIndex = "10";
    }

    // Paredes
    const wallThickness = 50;
    const wallOptions = {
      isStatic: true,
      render: { visible: false },
      friction: 0.3,
      restitution: 0.2,
    };

    const walls = [
      Bodies.rectangle(
        width / 2,
        height + wallThickness / 2,
        width,
        wallThickness,
        wallOptions
      ),
      Bodies.rectangle(
        width / 2,
        -wallThickness / 2,
        width,
        wallThickness,
        wallOptions
      ),
      Bodies.rectangle(
        -wallThickness / 2,
        height / 2,
        wallThickness,
        height * 2,
        wallOptions
      ),
      Bodies.rectangle(
        width + wallThickness / 2,
        height / 2,
        wallThickness,
        height * 2,
        wallOptions
      ),
    ];
    World.add(engine.world, walls);

    // Crear cuerpos
    const bodies = items.map((item, index) => {
      const x = (width / (items.length + 1)) * (index + 1);
      const y = -100 - index * 80;
      const body = Bodies.rectangle(x, y, 140, 60, {
        restitution: 0.5,
        friction: 0.5,
        frictionAir: 0.01,
        density: 0.004,
        render: { fillStyle: "transparent" },
      });
      Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2);
      return body;
    });

    bodiesRef.current = bodies;
    World.add(engine.world, bodies);

    // Mouse constraint
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    });
    World.add(engine.world, mouseConstraint);

    // Loop de actualización
    const updateLoop = () => {
      const positions = new Map<number, ItemPosition>();
      bodies.forEach((body, index) => {
        positions.set(items[index].id, {
          x: body.position.x,
          y: body.position.y,
          rotation: body.angle,
        });
      });
      setItemPositions(positions);
      animationRef.current = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    // Iniciar simulación
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    setIsReady(true);
  }, [items]);

  useEffect(() => {
    if (window.Matter) {
      initPhysics();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (window.Matter && engineRef.current) {
        const Matter = window.Matter;
        if (renderRef.current) Matter.Render.stop(renderRef.current);
        if (runnerRef.current) Matter.Runner.stop(runnerRef.current);
        Matter.Engine.clear(engineRef.current);
        Matter.World.clear(engineRef.current.world, false);
        if (renderRef.current?.canvas) renderRef.current.canvas.remove();
      }
      engineRef.current = null;
    };
  }, [initPhysics]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-center py-6">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
          {title}
        </h2>
        <p className="text-white/60 text-sm md:text-base">
          Arrastra las tecnologías 🎯
        </p>
      </div>

      <div ref={containerRef} className={`flex-1 relative ${gradient}`}>
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-lg">Cargando física... ⚡</div>
          </div>
        )}

        {Array.from(itemPositions.entries()).map(([itemId, pos]) => {
          const item = items.find((i) => i.id === itemId);
          if (!item) return null;

          return (
            <div
              key={itemId}
              style={{
                position: "absolute",
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                transform: `translate(-50%, -50%) rotate(${pos.rotation}rad)`,
                pointerEvents: "none",
                zIndex: 1,
              }}
            >
              <div
                className="inline-flex items-center gap-2 md:gap-3 rounded-full px-3 md:px-5 py-2 md:py-3 shadow-lg border-2 backdrop-blur-sm"
                style={{
                  backgroundColor: `${item.color}33`,
                  borderColor: `${item.color}99`,
                  boxShadow: `0 4px 20px ${item.color}44`,
                }}
              >
                <span className="text-lg md:text-2xl">{item.icon}</span>
                <span className="text-xs md:text-sm font-semibold text-white hidden sm:inline">
                  {item.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente principal con carrusel
const PhysicsList: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMatterLoaded, setIsMatterLoaded] = useState(false);

  const stacks = [
    {
      id: "fullstack",
      title: "🚀 Full Stack",
      gradient:
        "bg-gradient-to-br from-purple-900 via-purple-700 to-purple-900",
      items: [
        { id: 1, text: "React", color: "#61DAFB", icon: "⚛️" },
        { id: 2, text: "TypeScript", color: "#3178C6", icon: "📘" },
        { id: 3, text: "Node.js", color: "#339933", icon: "🟢" },
        { id: 4, text: "MongoDB", color: "#47A248", icon: "🍃" },
        { id: 5, text: "Docker", color: "#2496ED", icon: "🐳" },
      ],
    },
    {
      id: "frontend",
      title: "🎨 Frontend",
      gradient: "bg-gradient-to-br from-cyan-900 via-cyan-700 to-cyan-900",
      items: [
        { id: 6, text: "React", color: "#61DAFB", icon: "⚛️" },
        { id: 7, text: "Vue", color: "#4FC08D", icon: "💚" },
        { id: 8, text: "Tailwind", color: "#06B6D4", icon: "🎨" },
        { id: 9, text: "Next.js", color: "#000000", icon: "▲" },
        { id: 10, text: "CSS", color: "#1572B6", icon: "🎭" },
      ],
    },
    {
      id: "backend",
      title: "⚙️ Backend",
      gradient: "bg-gradient-to-br from-green-900 via-green-700 to-green-900",
      items: [
        { id: 11, text: "Node.js", color: "#339933", icon: "🟢" },
        { id: 12, text: "Python", color: "#3776AB", icon: "🐍" },
        { id: 13, text: "PostgreSQL", color: "#336791", icon: "🐘" },
        { id: 14, text: "Redis", color: "#DC382D", icon: "⚡" },
        { id: 15, text: "Express", color: "#000000", icon: "🚂" },
      ],
    },
  ];

  useEffect(() => {
    if (!window.Matter) {
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js";
      script.async = true;
      script.onload = () => setIsMatterLoaded(true);
      document.body.appendChild(script);

      return () => {
        if (script.parentNode) script.parentNode.removeChild(script);
      };
    } else {
      setIsMatterLoaded(true);
    }
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? stacks.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === stacks.length - 1 ? 0 : prev + 1));
  };

  const handleDotClick = (index: number) => {
    setCurrentIndex(index);
  };

  if (!isMatterLoaded) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Cargando Matter.js... 🚀</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen relative overflow-hidden bg-slate-950">
      {/* Carrusel */}
      <div
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {stacks.map((stack) => (
          <div key={stack.id} className="w-full h-full flex-shrink-0">
            <PhysicsEngine
              items={stack.items}
              title={stack.title}
              gradient={stack.gradient}
            />
          </div>
        ))}
      </div>

      {/* Controles de navegación */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all"
        aria-label="Anterior"
      >
        <ChevronLeft className="w-6 h-6 text-white" />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 backdrop-blur-sm p-3 rounded-full transition-all"
        aria-label="Siguiente"
      >
        <ChevronRight className="w-6 h-6 text-white" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {stacks.map((stack, index) => (
          <button
            key={stack.id}
            onClick={() => handleDotClick(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentIndex
                ? "bg-white scale-125"
                : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Ir a ${stack.title}`}
          />
        ))}
      </div>

      {/* Contador */}
      <div className="absolute top-6 right-6 z-20 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
        <span className="text-white font-semibold">
          {currentIndex + 1} / {stacks.length}
        </span>
      </div>
    </div>
  );
};

export default PhysicsList;
