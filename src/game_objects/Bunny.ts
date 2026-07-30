import {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import {Mat4x4} from "../math/Mat4x4.ts";
import {Vec3} from "../math/Vec3.ts";
import {Color} from "../math/Color.ts";
import type {Camera} from "../camera/Camera.ts";
import {GeometryBuffersCollection} from "../attribute_buffer/GeometryBuffersCollection.ts";
import {Texture2D} from "../texture/Texture2D.ts";
import type {AmbientLight} from "../lights/AmbientLight.ts";
import {RenderPipeline} from "../pipelines/RenderPipeline.ts";
import type {DirectionalLight} from "../lights/DirectionalLight.ts";
import {Mat3x3} from "../math/Mat3x3.ts";
import {type PointLight, PointLightsCollection} from "../lights/PointLight.ts";
import {ShadowRenderpipeline} from "../pipelines/ShadowRenderPipeline.ts";
import type {ShadowCamera} from "../camera/ShadowCamera.ts";

export class Bunny{
    public pipeline: RenderPipeline;
    private shadowPipeline: ShadowRenderpipeline;

    private transfromBuffer: UniformBuffer;
    private normalMatrixBuffer: UniformBuffer;

    private transfrom =  Mat4x4.identity();

    public scale = new Vec3(0.5, 0.5, 0.5);

    public position = new Vec3(0, 0, 0);

    public color = new Color(1, 1, 0, 1);

    private angle = 0;

    constructor(device : GPUDevice, camera: Camera, shadowCamera: ShadowCamera,
                texture: Texture2D, ambientLight: AmbientLight,
                directionalLight: DirectionalLight, pointLights: PointLightsCollection) {
        this.transfromBuffer = new UniformBuffer(device, this.transfrom, "Bunny Transform");
        this.normalMatrixBuffer = new UniformBuffer(device, 16 * Float32Array.BYTES_PER_ELEMENT, "Bunny Normal Matrix");

        this.pipeline = new RenderPipeline(device, camera, shadowCamera, this.transfromBuffer, this.normalMatrixBuffer, ambientLight, directionalLight, pointLights);

        this.pipeline.diffuseTexture = texture;


        this.shadowPipeline = new ShadowRenderpipeline(device, shadowCamera, this.transfromBuffer);
    }

    public update() {
        //this.angle += 0.01;
        const scale = Mat4x4.scale(this.scale.x, this.scale.y, this.scale.z);
        const rotation = Mat4x4.rotationY(this.angle);
        const translate = Mat4x4.translation(this.position.x, this.position.y, this.position.z);
        this.transfrom = Mat4x4.multiply(translate, scale);
        this.transfrom = Mat4x4.multiply(this.transfrom, rotation);

        let normalMatrix = Mat3x3.fromMat4x4(this.transfrom);
        normalMatrix = Mat3x3.transpose(normalMatrix);
        normalMatrix = Mat3x3.inverse(normalMatrix);

        this.normalMatrixBuffer.update(Mat3x3.to16AlignedMat3x3(normalMatrix));

        this.transfromBuffer.update(this.transfrom);
    }

    public draw(renderPassEncoder: GPURenderPassEncoder){
        this.pipeline.diffuseColor = this.color;
        this.pipeline.draw(renderPassEncoder, GeometryBuffersCollection.bunnyBuffers);
    }

    public drawShadows(renderPassEncode: GPURenderPassEncoder){
        this.shadowPipeline.draw(renderPassEncode, GeometryBuffersCollection.bunnyBuffers);
    }

}