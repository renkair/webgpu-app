import type {Camera} from "../camera/Camera.ts";
import {SkyboxRenderPipeline} from "../pipelines/SkyboxRenderPipeline.ts";
import type {TextureCubemap} from "../texture/TextureCubemap.ts";

export class Skybox{
    public pipeline: SkyboxRenderPipeline;
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