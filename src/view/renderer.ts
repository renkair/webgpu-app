import {TriangleMesh} from "./triangle_mesh.ts";
import shader from "./shaders/shader.wgsl?raw";
import {mat4} from "gl-matrix"
import {Material} from "./material.ts";
import type {Camera} from "../model/camera.ts";
import type {Triangle} from "../model/triangle.ts";


export class Renderer {
    canvas: HTMLCanvasElement;

    // device/context object
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    // Pipeline Objects
    uniformBuffer: GPUBuffer;
    bindGroup: GPUBindGroup;
    bindGroupLayout: GPUBindGroupLayout;
    pipeline: GPURenderPipeline;

    // Assets
    triangleMesh: TriangleMesh;
    material: Material;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async Initialize(){
        await this.setupDevice();

        await this.createAsset();

        await this.makePipeline();

    }

    async setupDevice()
    {
        this.adapter = <GPUAdapter> await navigator.gpu?.requestAdapter();
        this.device = <GPUDevice> await this.adapter?.requestDevice();
        this.context = <GPUCanvasContext> this.canvas.getContext('webgpu');
        this.format = "bgra8unorm";
        this.context.configure({
            device : this.device,
            format : this.format,
        });
    }

    async makePipeline(){
        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 3,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                }
            ],
        });

        this.bindGroup = this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer : this.uniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: this.material.view
                },
                {
                    binding: 2,
                    resource: this.material.sampler
                }
            ]
        });

        const pipelinelayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.bindGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({

            vertex : {
                module : this.device.createShaderModule({
                    code : shader
                }),
                entryPoint : "vs_main",
                buffers: [this.triangleMesh.bufferLayout, ]
            },
            fragment : {
                module : this.device.createShaderModule({
                    code : shader
                }),
                entryPoint : "fs_main",
                targets : [{format : this.format}]
            },
            primitive : {
                topology : "triangle-list"
            },
            layout: pipelinelayout,
        });
    }

    async createAsset(){
        this.triangleMesh = new TriangleMesh(this.device);
        this.material = new Material();
        await this.material.initialize(this.device, "/assets/img/test.jpg");
    }

    async render(camera: Camera, triangles: Triangle[]){

        const projection = mat4.create();
        mat4.perspective(projection, Math.PI/4, 800/600, 0.1, 10);

        const view = camera.get_view();


        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 128, <ArrayBuffer>projection);

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();
        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments : [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b : 0.25, a : 1.0},
                loadOp : "clear",
                storeOp : "store"
            }]
        });

        renderpass.setPipeline(this.pipeline);


        renderpass.setVertexBuffer(0, this.triangleMesh.buffer);

        triangles.forEach((triangle) => {
            const model = triangle.get_model();
            this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>model);
            renderpass.setBindGroup(0, this.bindGroup);
            renderpass.draw(3, 1, 0, 0);
        })



        renderpass.end();

        this.device.queue.submit([commandEncoder.finish()]);
    }
}