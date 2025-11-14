import React, { useEffect, useRef } from "react";
import Matter from "matter-js";

interface TechTagProps {
  tags: string[];
}

const TechTags: React.FC<TechTagProps> = ({ tags }) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);

  useEffect(() => {
    if (!sceneRef.current) return;

    // Inicializar módulos de Matter
    const { Engine, Render, Runner, Bodies, World, Mouse, MouseConstraint } =
      Matter;

    // Crear motor
    const engine = Engine.create({
      gravity: { y: 0.5, x: 0, scale: 0.001 },
    });
    engineRef.current = engine;

    // Crear renderizador
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: sceneRef.current.clientWidth,
        height: 600,
        wireframes: false,
        background: "#f0f0f0",
      },
    });
    renderRef.current = render;

    // Crear tags como cuerpos físicos
    const tagBodies = tags.map((tag, index) => {
      return Bodies.rectangle(
        Math.random() * render.options.width!,
        -index * 30, // Espaciado inicial
        120,
        40,
        {
          chamfer: { radius: 8 },
          render: {
            fillStyle: getRandomColor(),
            strokeStyle: "#000",
            lineWidth: 1,
          },
          label: tag,
        }
      );
    });

    // Crear límites
    const boundaries = [
      Bodies.rectangle(
        render.options.width! / 2,
        610,
        render.options.width!,
        20,
        { isStatic: true }
      ),
      Bodies.rectangle(-10, 300, 20, 600, { isStatic: true }),
      Bodies.rectangle(render.options.width!! + 10, 300, 20, 600, {
        isStatic: true,
      }),
    ];

    // Agregar al mundo
    World.add(engine.world, [...tagBodies, ...boundaries]);

    // Configurar mouse
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });

    World.add(engine.world, mouseConstraint);

    // Mantener el canvas responsive
    const handleResize = () => {
      if (sceneRef.current) {
        render.options.width = sceneRef.current.clientWidth;
        Render.setPixelRatio(render, window.devicePixelRatio);
        Render.lookAt(render, {
          min: { x: 0, y: 0 },
          max: { x: sceneRef.current.clientWidth, y: 600 },
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Iniciar renderizado y simulación
    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    // Limpieza
    return () => {
      window.removeEventListener("resize", handleResize);
      Render.stop(render);
      World.clear(engine.world, false);
      Engine.clear(engine);
      render.canvas.remove();
    };
  }, [tags]);

  // Función para generar colores aleatorios
  const getRandomColor = () => {
    return `hsl(${Math.random() * 360}, 70%, 60%)`;
  };

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <div ref={sceneRef} style={{ width: "100%" }} />
    </div>
  );
};

export default TechTags;
