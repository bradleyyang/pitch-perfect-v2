"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeContext";

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { isDark } = useTheme();

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: document.documentElement.scrollHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Also update on scroll in case page height changes
    const observer = new ResizeObserver(updateDimensions);
    observer.observe(document.body);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Colors based on theme
    const particleColor = isDark ? "255, 255, 255" : "0, 0, 0";
    const bgColor = isDark ? "10, 10, 10" : "255, 255, 255";

    // Particle system
    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      targetOpacity: number;
    }> = [];

    const PARTICLE_COUNT = 100;
    const CONNECTION_DISTANCE = 120;
    const MOUSE_RADIUS = 180;

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.2 + 0.05,
        targetOpacity: Math.random() * 0.2 + 0.05,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY + window.scrollY };
    };

    const handleScroll = () => {
      // Update mouse position relative to scroll
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll);

    let animationId: number;

    const animate = () => {
      // Clear with background color
      ctx.fillStyle = `rgba(${bgColor}, 1)`;
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);

      const mouse = mouseRef.current;
      const scrollY = window.scrollY;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Mouse interaction - particles are attracted/repelled
        const dx = mouse.x - particle.x;
        const dy = (mouse.y - scrollY) - particle.y + scrollY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < MOUSE_RADIUS && distance > 0) {
          const force = (MOUSE_RADIUS - distance) / MOUSE_RADIUS;
          particle.vx += (dx / distance) * force * 0.015;
          particle.vy += (dy / distance) * force * 0.015;
          particle.targetOpacity = isDark ? 0.5 : 0.4;
        } else {
          particle.targetOpacity = Math.random() * 0.2 + 0.05;
        }

        // Smooth opacity transition
        particle.opacity += (particle.targetOpacity - particle.opacity) * 0.03;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Apply friction
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Wrap around edges
        if (particle.x < 0) particle.x = dimensions.width;
        if (particle.x > dimensions.width) particle.x = 0;
        if (particle.y < 0) particle.y = dimensions.height;
        if (particle.y > dimensions.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
        ctx.fill();

        // Draw connections to nearby particles
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const connDx = particle.x - other.x;
          const connDy = particle.y - other.y;
          const connDist = Math.sqrt(connDx * connDx + connDy * connDy);

          if (connDist < CONNECTION_DISTANCE) {
            const opacity = (1 - connDist / CONNECTION_DISTANCE) * 0.1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${particleColor}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw gradient glow around mouse
      const gradient = ctx.createRadialGradient(
        mouse.x,
        mouse.y - scrollY + scrollY,
        0,
        mouse.x,
        mouse.y - scrollY + scrollY,
        MOUSE_RADIUS
      );
      gradient.addColorStop(0, `rgba(${particleColor}, 0.03)`);
      gradient.addColorStop(0.5, `rgba(${particleColor}, 0.01)`);
      gradient.addColorStop(1, `rgba(${particleColor}, 0)`);

      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y - scrollY + scrollY, MOUSE_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationId);
    };
  }, [dimensions, isDark]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: "transparent" }}
    />
  );
}
