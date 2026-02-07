import { Component, ElementRef, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';

@Component({
    selector: 'app-shadow-cursor',
    standalone: true,
    template: '<canvas #canvas></canvas>',
    styles: [`
    :host {
      display: block !important;
      width: 100vw !important;
      height: 100vh !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      z-index: -1 !important;
      pointer-events: none !important;
      background: #11111a !important; /* Deep dark base */
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
  `]
})
export class ShadowCursorComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
    private ctx!: CanvasRenderingContext2D;
    private animationId!: number;
    private mouse = { x: 0, y: 0 };
    private particles: Particle[] = [];
    private width = 0;
    private height = 0;

    ngOnInit() { }

    ngAfterViewInit() {
        setTimeout(() => {
            this.initCanvas();
            this.createParticles();
            this.animate();
            window.addEventListener('resize', this.onResize.bind(this));
            window.addEventListener('mousemove', this.onMouseMove.bind(this));
        }, 100);
    }

    ngOnDestroy() {
        cancelAnimationFrame(this.animationId);
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('mousemove', this.onMouseMove);
    }

    private initCanvas() {
        const canvas = this.canvasRef.nativeElement;
        this.ctx = canvas.getContext('2d')!;
        this.onResize();
        this.mouse.x = this.width / 2;
        this.mouse.y = this.height / 2;
    }

    private onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvasRef.nativeElement.width = this.width;
        this.canvasRef.nativeElement.height = this.height;
    }

    private onMouseMove(e: MouseEvent) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    private createParticles() {
        this.particles = [];
        const count = 35;
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.width, this.height));
        }
    }

    private animate() {
        if (!this.ctx) return;

        // 1. Draw "Ambient" Background
        this.ctx.fillStyle = '#1e1e2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 2. Shadows (Dark elongated polygons)
        this.particles.forEach(p => {
            p.update(this.width, this.height);
            this.drawShadowPath(p);
        });

        // 3. Global Darkness Mask
        this.drawGlobalLighting();

        // 4. Draw Particles
        this.particles.forEach(p => {
            p.draw(this.ctx);
        });

        this.animationId = requestAnimationFrame(this.animate.bind(this));
    }

    private drawShadowPath(p: Particle) {
        const { x: mx, y: my } = this.mouse;
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 1) return;

        const shadowLength = 2000;
        const angle = Math.atan2(dy, dx);
        const spread = (p.size / dist) * 2;

        this.ctx.beginPath();
        this.ctx.moveTo(p.x + Math.cos(angle + 1.5) * p.size / 2, p.y + Math.sin(angle + 1.5) * p.size / 2);
        this.ctx.lineTo(p.x + Math.cos(angle - 1.5) * p.size / 2, p.y + Math.sin(angle - 1.5) * p.size / 2);
        this.ctx.lineTo(p.x + Math.cos(angle - spread) * shadowLength, p.y + Math.sin(angle - spread) * shadowLength);
        this.ctx.lineTo(p.x + Math.cos(angle + spread) * shadowLength, p.y + Math.sin(angle + spread) * shadowLength);
        this.ctx.closePath();
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.7)';
        this.ctx.fill();
    }

    private drawGlobalLighting() {
        const { x, y } = this.mouse;

        // 1. Darkness Gradient
        const shadowGradient = this.ctx.createRadialGradient(x, y, 100, x, y, 800);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
        this.ctx.fillStyle = shadowGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
}

class Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    color: string;

    constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 6 + 4;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        const colors = ['#f1c40f', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update(width: number, height: number) {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.rect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
        ctx.fill();

        const glow = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 2);
        glow.addColorStop(0, this.color + '44');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
