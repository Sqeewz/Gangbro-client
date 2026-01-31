import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.html',
  styleUrls: ['./not-found.scss']
})
export class NotFound implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;
  private animationId: number = 0;
  private stars: Star[] = [];
  private width: number = 0;
  private height: number = 0;
  private mouse = { x: 0, y: 0 };
  private center = { x: 0, y: 0 };

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));

    this.initStars();
    this.animate();
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resize.bind(this));
    window.removeEventListener('mousemove', this.onMouseMove.bind(this));
    cancelAnimationFrame(this.animationId);
  }

  private resize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.center = { x: this.width / 2, y: this.height / 2 };
    this.canvasRef.nativeElement.width = this.width;
    this.canvasRef.nativeElement.height = this.height;
    this.initStars();
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  private initStars(): void {
    this.stars = [];
    const numStars = 200;
    for (let i = 0; i < numStars; i++) {
      this.stars.push(new Star(this.width, this.height));
    }
  }

  private animate(): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; // Trail effect
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw stars
    this.stars.forEach(star => {
      star.update(this.width, this.height);
      star.draw(this.ctx);
    });

    // Draw Eye
    this.drawEye();

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  private drawEye(): void {
    const eyeRadius = 100; // Increased radius for better visibility behind text
    const pupilRadius = 40;

    // Calculate angle to mouse
    const dx = this.mouse.x - this.center.x;
    const dy = this.mouse.y - this.center.y;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx * dx + dy * dy), eyeRadius - pupilRadius - 10);

    const pupilX = this.center.x + Math.cos(angle) * distance;
    const pupilY = this.center.y + Math.sin(angle) * distance;

    // Eye Sclera (White part)
    this.ctx.beginPath();
    this.ctx.arc(this.center.x, this.center.y, eyeRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.shadowBlur = 50;
    this.ctx.shadowColor = '#fff';
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Pupil
    this.ctx.beginPath();
    this.ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#000';
    this.ctx.fill();

    // Iris highlight
    this.ctx.beginPath();
    this.ctx.arc(pupilX - 10, pupilY - 10, 10, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.fill();
  }
}

class Star {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;

  constructor(w: number, h: number) {
    this.x = Math.random() * w;
    this.y = Math.random() * h;
    this.size = Math.random() * 2;
    this.speedX = (Math.random() - 0.5) * 0.2;
    this.speedY = (Math.random() - 0.5) * 0.2;
  }

  update(width: number, height: number): void {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
    ctx.fill();
  }
}