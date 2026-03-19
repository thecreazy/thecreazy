/**
 * WebGLScene — async Three.js background
 * Loaded only after the page is fully interactive.
 * If WebGL is unavailable the site degrades gracefully.
 */

import * as THREE from 'three'

// Import the GLSL shader as a string (Vite handles this via ?raw)
// We inline it here to avoid an extra fetch (the shader is small).
const NOISE_FRAG = /* glsl */`
uniform float uTime;
uniform vec2  uResolution;
uniform vec3  uColorA;
uniform vec3  uColorBg;
uniform float uDark;
varying vec2 vUv;

vec3 mod289v3(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289v4(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289v4(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.7928429-0.8537347*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);
  const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289v3(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;
  vec4 s1=floor(b1)*2.+1.;
  vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
  m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  vec2 uv=vUv;
  float t=uTime*0.06;
  float n1=snoise(vec3(uv*2.5,t));
  float n2=snoise(vec3(uv*5.+10.,t*1.3));
  float n3=snoise(vec3(uv*1.2-5.,t*.7));
  float n=(n1*.5+n2*.3+n3*.2)*.5+.5;
  vec2 q=uv-.5;
  float vignette=clamp(1.-dot(q,q)*1.8,0.,1.);
  vec3 color=mix(uColorBg,uColorA,n*0.07)*vignette;
  float grain=snoise(vec3(uv*700.,uTime*15.))*.03;
  color+=grain*(uDark>.5?.5:.15);
  gl_FragColor=vec4(color,1.0);
}
`

const VERT = /* glsl */`
varying vec2 vUv;
void main(){
  vUv=uv;
  gl_Position=vec4(position,1.0);
}
`

function hexToVec3(hex: string): THREE.Vector3 {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  return new THREE.Vector3(r, g, b)
}

function getThemeColors(): { accent: THREE.Vector3; bg: THREE.Vector3; dark: number } {
  const style = getComputedStyle(document.documentElement)
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'

  const accentHex = isDark ? '#b6a8db' : '#01470f'
  const bgHex     = isDark ? '#0a0a0a' : '#f7f7f7'

  return {
    accent: hexToVec3(accentHex),
    bg:     hexToVec3(bgHex),
    dark:   isDark ? 1.0 : 0.0,
  }
}

export class WebGLScene {
  private renderer: THREE.WebGLRenderer
  private scene:    THREE.Scene
  private camera:   THREE.OrthographicCamera
  private material: THREE.ShaderMaterial
  private raf:      number = 0
  private start:    number = performance.now()

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    this.scene  = new THREE.Scene()

    const { accent, bg, dark } = getThemeColors()

    this.material = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: NOISE_FRAG,
      uniforms: {
        uTime:       { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uColorA:     { value: accent },
        uColorBg:    { value: bg },
        uDark:       { value: dark },
      },
    })

    const geo  = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geo, this.material)
    this.scene.add(mesh)

    this.bindEvents()
    this.tick()
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    this.material.uniforms.uTime.value = (performance.now() - this.start) / 1000
    this.renderer.render(this.scene, this.camera)
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize, { passive: true })

    // Update colors on theme change
    const observer = new MutationObserver(() => {
      const { accent, bg, dark } = getThemeColors()
      this.material.uniforms.uColorA.value  = accent
      this.material.uniforms.uColorBg.value = bg
      this.material.uniforms.uDark.value    = dark
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  private onResize = () => {
    const w = window.innerWidth
    const h = window.innerHeight
    this.renderer.setSize(w, h)
    this.material.uniforms.uResolution.value.set(w, h)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }
}
