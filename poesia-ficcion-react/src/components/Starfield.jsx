import { useEffect, useRef } from 'react';

function Starfield() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const colors = ['#ffffff', '#f0c060', '#9080ff', '#d060a0', '#40b0c0'];
        const starCount = 140;
        const stars = [];
        const dpr = window.devicePixelRatio || 1;
        let width = 0;
        let height = 0;
        let animationId;

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };

        const createStar = () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            radius: Math.random() * 1.5 + 0.4,
            alpha: Math.random() * 0.7 + 0.2,
            speed: Math.random() * 0.12 + 0.02,
            color: colors[Math.floor(Math.random() * colors.length)],
        });

        const createStars = () => {
            stars.length = 0;
            for (let i = 0; i < starCount; i += 1) {
                stars.push(createStar());
            }
        };

        const drawStars = () => {
            ctx.clearRect(0, 0, width, height);
            stars.forEach((star) => {
                star.y -= star.speed;
                if (star.y < -10) {
                    Object.assign(star, createStar(), { y: height + 10 });
                }

                ctx.beginPath();
                ctx.globalAlpha = star.alpha;
                ctx.fillStyle = star.color;
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            animationId = requestAnimationFrame(drawStars);
        };

        const handleMouseMove = (event) => {
            const dx = (event.clientX / width - 0.5) * 10;
            const dy = (event.clientY / height - 0.5) * 10;
            canvas.style.transform = `translate(${dx}px, ${dy}px)`;
        };

        const start = () => {
            resizeCanvas();
            createStars();
            drawStars();
        };

        start();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <>
            <div className="nebula-bg" />
            <canvas id="starfield" ref={canvasRef} />
        </>
    );
}

export default Starfield;
