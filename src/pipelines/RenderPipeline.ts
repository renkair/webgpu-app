import materialShader from "../shaders/MaterialShader.wgsl?raw";
import type {GeometryBuffers} from "../attribute_buffer/GeometryBuffers.ts";
import type {Texture2D} from "../texture/Texture2D.ts";
import {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import {Vec2} from "../math/Vec2.ts";
import {Color} from "../math/Color.ts";
import type {Camera} from "../camera/Camera.ts";
import type {AmbientLight} from "../lights/AmbientLight.ts";
import type {DirectionalLight} from "../lights/DirectionalLight.ts";
import type {PointLightsCollection} from "../lights/PointLight.ts";
export class RenderPipeline {
    private renderPipeline: GPURenderPipeline;
    private vertexGroupLayout:GPUBindGroupLayout; // slot 0
    private projectionViewGroupLayout: GPUBindGroupLayout; // slot 1
    private materialBindGroupLayout: GPUBindGroupLayout; // slot 2
    private lightsGroupLayout: GPUBindGroupLayout; // slot 3
    private vertexBindGroup!: GPUBindGroup; // slot 0
    private projectionViewBindGroup: GPUBindGroup; // slot 1
    private materialBindGroup!: GPUBindGroup; // slot 2
    private lightBindGroup!: GPUBindGroup; // slot 3

    private _diffuseTexture? : Texture2D;

    public set diffuseTexture(texture: Texture2D){
        this._diffuseTexture = texture;
        this.materialBindGroup = this.createMaterialBindGroup(texture);
    }

    private textureTillingBuffer: UniformBuffer;
    private _textureTilling: Vec2 = new Vec2(1, 1);
    public set textureTilling(value: Vec2){
        this._textureTilling = value;
        this.textureTillingBuffer.update(value);
    }

    private diffuseColorBuffer: UniformBuffer;
    private _diffuseColor: Color = Color.white();
    public set diffuseColor(value: Color){
        this._diffuseColor = value;
        this.diffuseColorBuffer.update(value);
    }




    constructor(private device: GPUDevice,
                private camera: Camera,
                private transformsBuffer: UniformBuffer,
                private normalMatrixBuffer: UniformBuffer,
                ambientLight: AmbientLight,
                directionalLight: DirectionalLight,
                pointLight: PointLightsCollection) {
        this.textureTillingBuffer = new UniformBuffer(device, this._textureTilling, "texture Tilling buffer");
        this.diffuseColorBuffer = new UniformBuffer(device, this._diffuseColor, "diffuseColor Tilling buffer");
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
        // color
        bufferLayout.push({
            arrayStride : 4 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
                {
                    shaderLocation: 1,
                    offset: 0,
                    format: "float32x4"
                }
            ]
        });
        // texCoords
        bufferLayout.push({
            arrayStride : 2 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
                {
                    shaderLocation: 2,
                    offset: 0,
                    format: "float32x2"
                }
            ]
        });

        // normals
        bufferLayout.push({
            arrayStride : 3 * Float32Array.BYTES_PER_ELEMENT,
            attributes: [
                {
                    shaderLocation: 3,
                    offset: 0,
                    format: "float32x3"
                }
            ]
        });

        this.vertexGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding:0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding:1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding:2,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        });

        this.projectionViewGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                }
            ]
        });

        this.materialBindGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
            ]
        });

        this.lightsGroupLayout = device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    buffer: {}
                },
            ]
        });

        const layout = device.createPipelineLayout(
            {
                bindGroupLayouts: [
                    this.vertexGroupLayout,  // group 0
                    this.projectionViewGroupLayout, // group 1
                    this.materialBindGroupLayout, // group 2
                    this.lightsGroupLayout // group 3
                ]
            }
        );

        this.renderPipeline = device.createRenderPipeline({
            layout: layout,
            label: "Render Pipeline",
            vertex : {
                buffers: bufferLayout,
                module : device.createShaderModule({
                    code : materialShader
                }),
                entryPoint : "materialVS",
            },
            fragment : {
                module : device.createShaderModule({
                    code : materialShader
                }),
                entryPoint : "materialFS",
                targets : [{format : "bgra8unorm"}]
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

        this.vertexBindGroup = device.createBindGroup({
            layout: this.vertexGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.transformsBuffer.buffer,
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.normalMatrixBuffer.buffer,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.textureTillingBuffer.buffer,
                    }
                }
            ]
        });

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

        this.lightBindGroup = device.createBindGroup({
            layout: this.lightsGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: ambientLight.buffer.buffer,
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: directionalLight.buffer.buffer,
                    }
                },
                {
                    binding: 2,
                    resource: {
                        buffer: pointLight.buffer.buffer,
                    }
                },
            ]
        })
    }
    private createMaterialBindGroup(texture: Texture2D) {
        return this.device.createBindGroup({
            layout: this.materialBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: texture.texture.createView()
                },
                {
                    binding: 1,
                    resource: texture.sampler
                },
                {
                    binding: 2,
                    resource: {
                        buffer: this.diffuseColorBuffer.buffer,
                    }
                }
            ]
        });
    }

    public draw(renderPassEncoder: GPURenderPassEncoder, buffer: GeometryBuffers, instanceCount = 1) {
        renderPassEncoder.setPipeline(this.renderPipeline);
        renderPassEncoder.setVertexBuffer(0, buffer.positionBuffer);
        renderPassEncoder.setVertexBuffer(1, buffer.colorBuffer);
        renderPassEncoder.setVertexBuffer(2, buffer.texCoordsBuffer);
        renderPassEncoder.setVertexBuffer(3, buffer.normalsBuffer);

        renderPassEncoder.setBindGroup(0, this.vertexBindGroup);
        renderPassEncoder.setBindGroup(1, this.projectionViewBindGroup);
        renderPassEncoder.setBindGroup(2, this.materialBindGroup);
        renderPassEncoder.setBindGroup(3, this.lightBindGroup);


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