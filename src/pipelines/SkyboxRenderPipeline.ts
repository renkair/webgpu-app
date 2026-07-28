import skyboxShader from "../shaders/SkyboxShader.wgsl?raw";
import type {Camera} from "../camera/Camera.ts";
import type {TextureCubemap} from "../texture/TextureCubemap.ts";
export class SkyboxRenderPipeline{
    private renderPipeline: GPURenderPipeline;
    private groupLayout:GPUBindGroupLayout; // slot 0

    private bindGroup!: GPUBindGroup; // slot 0

    /*
    @group(0) @binding(0) var<uniform> camera: Camera;
    @group(0) @binding(1) var skyTexture: texture_cube<f32>;
    @group(0) @binding(2) var skySampler: sampler;
    * */

    constructor(private device: GPUDevice,
                private camera: Camera,
                private skyTexture: TextureCubemap) {
        // position
        const bufferLayout : Array<GPUVertexBufferLayout> = [];

        this.groupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding:0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding:1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { viewDimension: "cube" }
                },
                {
                    binding:2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                }
            ]
        });


        const layout = device.createPipelineLayout(
            {
                bindGroupLayouts: [
                    this.groupLayout,  // group 0
                ]
            }
        );

        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            label: "Render Pipeline",
            vertex : {
                buffers: bufferLayout,
                module : device.createShaderModule({
                    code : skyboxShader
                }),
                entryPoint : "sky_vert_main",
            },
            fragment : {
                module : device.createShaderModule({
                    code : skyboxShader
                }),
                entryPoint : "sky_frag_main",
                targets : [{format : "bgra8unorm"}]
            },
            primitive : {
                topology : "triangle-list"
            },
            // CONFIGURE DEPTH
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less-equal",
                format: "depth24plus-stencil8"
            }
        });


        this.bindGroup = device.createBindGroup({
            layout: this.groupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.camera.skyboxBuffer.buffer,
                    },
                },
                {
                    binding: 1,
                    resource: this.skyTexture.textureCubemap.createView({
                        dimension: "cube"
                    }),
                },
                {
                    binding: 2,
                    resource: this.skyTexture.sampler

                }
            ]
        });

    }

    public draw(renderPassEncoder: GPURenderPassEncoder) {
        renderPassEncoder.setPipeline(this.renderPipeline);

        renderPassEncoder.setBindGroup(0, this.bindGroup);

        renderPassEncoder.draw(6, 1, 0, 0);
    }
}