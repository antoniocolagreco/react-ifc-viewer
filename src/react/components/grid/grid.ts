import { Color, DoubleSide, Mesh, PlaneGeometry, ShaderMaterial, type ColorRepresentation } from 'three'

type GridOptions = {
	size1?: number
	size2?: number
	color?: ColorRepresentation
	distance?: number
	fade?: number
}

class Grid extends Mesh {
	override name = 'Grid'
	constructor(options?: GridOptions) {
		if (options === undefined) {
			options = {
				size1: 1,
				size2: 10,
				color: new Color('#bbb'),
				distance: 500,
				fade: 3,
			}
		}
		const { color, distance, fade, size1, size2 } = options

		const geometry = new PlaneGeometry(2, 2, 1, 1)

		const material = new ShaderMaterial({
			side: DoubleSide,

			uniforms: {
				uSize1: {
					value: size1,
				},
				uSize2: {
					value: size2,
				},
				uColor: {
					value: color,
				},
				uDistance: {
					value: distance,
				},
				uFade: {
					value: fade,
				},
				uZoom: {
					value: 1,
				},
			},
			transparent: true,
			vertexShader: `
            
            varying vec3 worldPosition;
            
            uniform float uDistance;
            
            void main() {
            
                    vec3 pos = position.xzy * uDistance;
                    pos.xz += cameraPosition.xz;
                    
                    worldPosition = pos;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            
            }
            `,

			fragmentShader: `
            
            varying vec3 worldPosition;
            
            uniform float uZoom;
            uniform float uFade;
            uniform float uSize1;
            uniform float uSize2;
            uniform vec3 uColor;
            uniform float uDistance;
                
                
                
                float getGrid(float size) {
                
                    vec2 r = worldPosition.xz / size;
                    
                    
                    vec2 grid = abs(fract(r - 0.5) - 0.5) / fwidth(r);
                    float line = min(grid.x, grid.y);
                    
                
                    return 1.0 - min(line, 1.0);
                }
                
            void main() {
            
                    
                    float d = 1.0 - min(distance(cameraPosition.xz, worldPosition.xz) / uDistance, 1.0);
                    
                    float g1 = getGrid(uSize1);
                    float g2 = getGrid(uSize2);
                    
                    float minZoom = step(0.2, uZoom);
                    float zoomFactor = pow(min(uZoom, 1.), 2.) * minZoom;
                    
                    gl_FragColor = vec4(uColor.rgb, mix(g2, g1, g1) * pow(d, uFade));
                    gl_FragColor.a = mix(0.5 * gl_FragColor.a, gl_FragColor.a, g2) * zoomFactor;
                    
                    if ( gl_FragColor.a <= 0.0 ) discard;
                    
            
            }
            
            `,
		})

		super(geometry, material)

		this.frustumCulled = false
	}
}

export { Grid }
