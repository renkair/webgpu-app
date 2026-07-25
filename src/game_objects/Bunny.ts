import {UnlitRenderpipeline} from "../pipelines/UnlitRenderpipeline.ts";
import {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import {Mat4x4} from "../math/Mat4x4.ts";
import {Vec3} from "../math/Vec3.ts";
import {Color} from "../math/Color.ts";
import type {Camera} from "../camera/Camera.ts";
import {GeometryBuffersCollection} from "../attribute_buffer/GeometryBuffersCollection.ts";
import {Texture2D} from "../texture/Texture2D.ts";
import type {AmbientLight} from "../lights/AmbientLight.ts";
import {Renderpipeline} from "../pipelines/RenderPipeline.ts";
import type {DirectionalLight} from "../lights/DirectionalLight.ts";

export class Bunny{
    private pipeline: Renderpipeline;
    private transfromBuffer: UniformBuffer;

    private transfrom =  Mat4x4.identity();

    public scale = new Vec3(1, 5, 1);

    public position = new Vec3(0, 0, 0);

    public color = new Color(1, 1, 1, 1);

    constructor(device : GPUDevice, camera: Camera, texture: Texture2D, ambientLight: AmbientLight, directionalLight: DirectionalLight) {
        this.transfromBuffer = new UniformBuffer(device, this.transfrom, "Bunny Transform");
        this.pipeline = new Renderpipeline(device, camera, this.transfromBuffer, ambientLight, directionalLight);


        this.pipeline.diffuseTexture = texture;
    }

    public update() {
        const  scale = Mat4x4.scale(this.scale.x, this.scale.y, this.scale.z);
        const translate = Mat4x4.translation(this.position.x, this.position.y, this.scale.z);
        this.transfrom = Mat4x4.multiply(translate, scale);

        this.transfromBuffer.update(this.transfrom);
    }

    public draw(renderPassEncoder: GPURenderPassEncoder){
        this.pipeline.diffuseColor = this.color;
        this.pipeline.draw(renderPassEncoder, GeometryBuffersCollection.cubeBuffers);

    }

}