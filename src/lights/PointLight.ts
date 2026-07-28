import {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import {Color} from "../math/Color.ts";
import {Vec3} from "../math/Vec3.ts";

export class PointLight {
    public color = new Color(1, 1, 1, 1);
    public intensity = 1;
    public position = new Vec3(0, 0, 0);
    public attenConst = 1;
    public attenLinear = 0.1;
    public attenQuad = 0.032;
}

export class PointLightsCollection{

    public buffer: UniformBuffer;

    public lights: PointLight[] = [
        new PointLight(),
        new PointLight(),
        new PointLight(),
    ];

    constructor(device: GPUDevice) {
        this.buffer = new UniformBuffer(device, 3 * 12 * Float32Array.BYTES_PER_ELEMENT,"Point Light Buffer");

    }

    public update()
    {
        for(let i = 0; i < this.lights.length; i++){
            this.buffer.update(new Float32Array([
                this.lights[i].color.r, this.lights[i].color.g, this.lights[i].color.b,
                this.lights[i].intensity,
                this.lights[i].position.x, this.lights[i].position.y, this.lights[i].position.z,
                this.lights[i].attenConst,
                this.lights[i].attenLinear,
                this.lights[i].attenQuad,
                0, 0,
            ]),
                i * 12 * Float32Array.BYTES_PER_ELEMENT);
        }
    }

}