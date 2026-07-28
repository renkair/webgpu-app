import type {Camera} from "../camera/Camera.ts";
import {GeometryBuffersCollection} from "../attribute_buffer/GeometryBuffersCollection.ts";
import {Texture2D} from "../texture/Texture2D.ts";
import type {AmbientLight} from "../lights/AmbientLight.ts";
import type {DirectionalLight} from "../lights/DirectionalLight.ts";
import {type PointLight, PointLightsCollection} from "../lights/PointLight.ts";
import {SkyboxRenderPipeline} from "../pipelines/SkyboxRenderPipeline.ts";
import type {TextureCubemap} from "../texture/TextureCubemap.ts";

export class Skybox{
    private pipeline: SkyboxRenderPipeline;
    constructor(private device: GPUDevice,
                private camera: Camera,
                private skyTexture: TextureCubemap) {

        this.pipeline = new SkyboxRenderPipeline(this.device, this.camera, this.skyTexture);
    }

    public update() {

    }

    public draw(renderPassEncoder: GPURenderPassEncoder){
        this.pipeline.draw(renderPassEncoder);
    }

}