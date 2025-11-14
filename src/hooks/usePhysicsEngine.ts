import { useEffect, useRef, useState, useCallback } from "react";
import type {
  MatterBody,
  MatterEngine,
  MatterRender,
  ListItem,
  ItemPosition,
} from "../types/physics";

interface UsePhysicsEngineProps {
  items: ListItem[];
  isActive: boolean;
}

export const usePhysicsEngine = ({
  items,
  isActive,
}: UsePhysicsEngineProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MatterEngine | null>(null);
  const runnerRef = useRef<any>(null);
  const bodiesRef = useRef<MatterBody[]>([]);
  const renderRef = useRef<MatterRender | null>(null);
  const animationRef = useRef<number | null>(null);
  const mouseConstraintRef = useRef<any>(null);

  const [itemPositions, setItemPositions] = useState<Map<number, ItemPosition>>(
    new Map()
  );
  const [isReady, setIsReady] = useState<boolean>(false);

  const createPhysicsWorld = useCallback(() => {
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

    const width: number = containerRef.current.clientWidth;
    const height: number = containerRef.current.clientHeight;

    // Crear engine
    const engine: MatterEngine = Engine.create();
    engineRef.current = engine;
    engine.world.gravity.y = 2;

    // Crear render
    const render: MatterRender = Render.create({
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
      render.canvas.style.cursor = "grab";
    }

    // Paredes
    const wallThickness: number = 50;
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
    const bodies: MatterBody[] = items.map((item: ListItem, index: number) => {
      const x: number = (width / (items.length + 1)) * (index + 1);
      const y: number = -100 - index * 80;
      const body: MatterBody = Bodies.rectangle(x, y, 140, 60, {
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

    // Mouse constraint para arrastrar
    const mouse = Mouse.create(render.canvas!);
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    mouseConstraintRef.current = mouseConstraint;
    World.add(engine.world, mouseConstraint);

    // Cambiar cursor cuando se arrastra
    render.canvas!.addEventListener("mousedown", () => {
      if (render.canvas) render.canvas.style.cursor = "grabbing";
    });

    render.canvas!.addEventListener("mouseup", () => {
      if (render.canvas) render.canvas.style.cursor = "grab";
    });

    // Loop de actualización
    const updateLoop = (): void => {
      const positions = new Map<number, ItemPosition>();
      bodies.forEach((body: MatterBody, index: number) => {
        positions.set(items[index].id, {
          x: body.position.x,
          y: body.position.y,
          rotation: body.angle,
        });
      });
      setItemPositions(positions);
      animationRef.current = requestAnimationFrame(updateLoop);
    };

    // Iniciar simulación
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);
    Render.run(render);

    setIsReady(true);

    // Iniciar loop de actualización
    updateLoop();
  }, [items]);

  const destroyPhysicsWorld = useCallback((): void => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (window.Matter && engineRef.current) {
      const Matter = window.Matter;
      if (renderRef.current) {
        Matter.Render.stop(renderRef.current);
        if (renderRef.current.canvas) {
          renderRef.current.canvas.remove();
        }
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (mouseConstraintRef.current) {
        Matter.World.remove(
          engineRef.current.world,
          mouseConstraintRef.current
        );
      }
      Matter.Engine.clear(engineRef.current);
      Matter.World.clear(engineRef.current.world, false);
    }

    engineRef.current = null;
    renderRef.current = null;
    runnerRef.current = null;
    mouseConstraintRef.current = null;
    bodiesRef.current = [];
    setItemPositions(new Map());
    setIsReady(false);
  }, []);

  // Efecto para manejar el ciclo de vida basado en isActive
  useEffect(() => {
    if (isActive && window.Matter) {
      // Crear el mundo de física cuando se activa
      createPhysicsWorld();
    } else if (!isActive) {
      // Destruir el mundo de física cuando se desactiva
      destroyPhysicsWorld();
    }

    return () => {
      destroyPhysicsWorld();
    };
  }, [isActive, createPhysicsWorld, destroyPhysicsWorld]);

  return {
    containerRef,
    itemPositions,
    isReady,
  };
};
