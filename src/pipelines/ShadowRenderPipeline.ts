import shadowShader from "../shaders/ShadowShader.wgsl?raw";
import type {GeometryBuffers} from "../attribute_buffer/GeometryBuffers.ts";
import type {Texture2D} from "../texture/Texture2D.ts";
import {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import type {ShadowCamera} from "../camera/ShadowCamera.ts";
export class ShadowRenderpipeline {
    private renderPipeline: GPURenderPipeline;
    private vertexGroupLayout:GPUBindGroupLayout; // slot 0
    private projectionViewGroupLayout: GPUBindGroupLayout; // slot 1
    private vertexBindGroup!: GPUBindGroup; // slot 0
    private projectionViewBindGroup: GPUBindGroup; // slot 1

    constructor(private device: GPUDevice, private camera: ShadowCamera, private transformsBuffer: UniformBuffer) {

        // position
        const bufferLayout : Array<GPUVertexBufferLayout> = [];
        bufferLayout.push({
            arrayStride : 3 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
                {
                    shaderLocation: 0,
                    offset: 0,
                    format: "float32x3"
                }
            ]
        });
        // RELATED TO VERTEX
        this.vertexGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding:0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
            ]
        });
        // RELATED TO CAMERA
        this.projectionViewGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        });

        const layout = device.createPipelineLayout(
            {
                bindGroupLayouts: [
                    this.vertexGroupLayout,  // group 0
                    this.projectionViewGroupLayout, // group 1
                ]
            }
        );

        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            label: "shadow Render Pipeline",
            vertex : {
                buffers: bufferLayout,
                module : device.createShaderModule({
                    code : shadowShader
                }),
                entryPoint : "shadowVS",
            },
            primitive : {
                topology : "triangle-list"
            },
            // CONFIGURE DEPTH
            depthStencil: {
                depthWriteEnabled: true,
                depthCompare: "less",
                format: "depth24plus-stencil8"
            }
        });
        // BIND GROUP RELATED TO VERTEX. TRANSFORMATION etc..
        this.vertexBindGroup = device.createBindGroup({
            layout: this.vertexGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.transformsBuffer.buffer,
                    }
                },
            ]
        });
        // BIND GROUP REALTED TO CAMERA PROJECTION VIEW etc...
        this.projectionViewBindGroup = device.createBindGroup({
            layout: this.projectionViewGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.camera.buffer.buffer,
                    }
                },
            ]
        });


    }

    public draw(renderPassEncoder: GPURenderPassEncoder, buffer: GeometryBuffers, instanceCount = 1) {
        renderPassEncoder.setPipeline(this.renderPipeline);
        renderPassEncoder.setVertexBuffer(0, buffer.positionBuffer);

        renderPassEncoder.setBindGroup(0, this.vertexBindGroup);
        renderPassEncoder.setBindGroup(1, this.projectionViewBindGroup);

        if(buffer.indicesBuffer)
        {
            renderPassEncoder.setIndexBuffer(buffer.indicesBuffer, "uint16");
            renderPassEncoder.drawIndexed(buffer.indexCount!, instanceCount, 0, 0);
        }
        else
        {
            renderPassEncoder.draw(buffer.vertexCount, instanceCount, 0, 0);
        }

    }
}