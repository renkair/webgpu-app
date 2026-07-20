import {vec3, vec4} from "gl-matrix";

export class AmbientLight {
    public color  = new vec4(1, 1, 1, 1);
    public intensity = 1;
    public buffer: GPUBuffer;



}