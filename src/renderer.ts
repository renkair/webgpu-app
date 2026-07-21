import {TriangleMesh} from "./triangle_mesh.ts";
import {QuadMesh} from "./quad_mesh.ts";
import shader from "./shaders/shader.wgsl?raw";
import {mat4} from "gl-matrix"
import {Material} from "./material.ts";
import {object_types, type RenderData} from "./definations.ts";
import {ObjMesh} from "./obj_mesh.ts";
import {UnlitRenderpipeline} from "./pipelines/UnlitRenderpipeline.ts";
import {GeometryBuilder} from "./geometry/GeometryBuilder.ts";
import {GeometryBuffer} from "./attribute_buffer/GeometryBuffer.ts";
import {Utilities} from "./Utilities.ts";
import {Texture2D} from "./texture/Texture2D.ts";
import {Vec2} from "./math/Vec2.ts";
import {Color} from "./math/Color.ts";
import {Mat4x4} from "./math/Mat4x4.ts";
import {Camera} from "./camera/Camera.ts";
import {UniformBuffer} from "./uniform_buffers/UniformBuffer.ts";


export class Renderer {
    canvas: HTMLCanvasElement;

    // device/context object
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    // Pipeline Objects
    uniformBuffer: GPUBuffer;
    frameGroupLayout: GPUBindGroupLayout;
    materialGroupLayout: GPUBindGroupLayout;
    frameBindGroup: GPUBindGroup;
    pipeline: GPURenderPipeline;
    testPipeline: UnlitRenderpipeline;

    // depth stencil stuff
    depthStencilStage: GPUDepthStencilState;
    depthStencilTexture: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;
    // Assets
    triangleMesh: TriangleMesh;
    quadMesh: QuadMesh;
    statueMesh: ObjMesh;
    triangleMaterial: Material;
    quadMaterial: Material;
    objectBuffer: GPUBuffer;
    geometryBuffer: GeometryBuffer;

    angle: number = 0;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async Initialize(){
        await this.setupDevice();

        await this.makeBindGroupLayouts();

        await this.createAsset();

        await this.makeDepthStencilTextureResources();

        await this.makePipeline();

        await this.makeBindGroup();

    }

    async setupDevice() {
        this.adapter = <GPUAdapter> await navigator.gpu?.requestAdapter();
        this.device = <GPUDevice> await this.adapter?.requestDevice();
        //this.device.pushErrorScope("validation");
        this.context = <GPUCanvasContext> this.canvas.getContext('webgpu');
        this.format = "bgra8unorm";
        this.context.configure({
            device : this.device,
            format : this.format,
        });
    }

    async makePipeline(){
        this.uniformBuffer = this.device.createBuffer({
            size: 64 * 2,
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        const pipelinelayout = this.device.createPipelineLayout({
            bindGroupLayouts: [this.frameGroupLayout, this.materialGroupLayout]
        });

        this.pipeline = this.device.createRenderPipeline({
            label: "myOldPipeline",
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
            depthStencil: this.depthStencilStage,
        });
    }
    async makeBindGroupLayouts() {
        this.frameGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage",
                        hasDynamicOffset : false
                    }
                }
            ],
        });

        this.materialGroupLayout = this.device.createBindGroupLayout({
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
                }
            ],
        });
    }
    async makeBindGroup(){
        this.frameBindGroup = this.device.createBindGroup({
            layout: this.frameGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.uniformBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: this.objectBuffer
                    }
                }
            ]
        })
    }

    async createAsset(){
        this.triangleMesh = new TriangleMesh(this.device);
        this.quadMesh = new QuadMesh(this.device);
        this.statueMesh = new ObjMesh();
        await this.statueMesh.initialize(this.device, "/assets/3dmodel/lowpolyBunny.obj");

        this.triangleMaterial = new Material();
        this.quadMaterial = new Material();

        const modelBufferDescriptor: GPUBufferDescriptor = {
            size: 64 * 1024,
            usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,

        };
        this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

        await this.triangleMaterial.initialize(this.device, "/assets/img/test.jpg", this.materialGroupLayout);
        await this.quadMaterial.initialize(this.device, "/assets/img/texture_01.png", this.materialGroupLayout);

        // do my test

        // - transfroms buffer
        const transfromsBuffer = new UniformBuffer(this.device, 100 * Mat4x4.BYTE_SIZE, "transforms Buffer");
        const transforms: Array<Mat4x4> = [];

        for(let i = 0; i < 100; i++){
            const transfromMatrix = Mat4x4.translation(
                Math.random()*10 - 5,  // -5 to 5
                Math.random()*10 - 5,  // -5 to 5
                Math.random()*10 + 5,   // 5 to 10
            );
            transforms.push(transfromMatrix);
            transfromsBuffer.update(transfromMatrix, i * Mat4x4.BYTE_SIZE);
        }


        const tempCamera: Camera = new Camera(this.device);
        //tempCamera.projectionView = Mat4x4.orthographic(-5, 5, -5, 5, 0, 1);
        tempCamera.projectionView = Mat4x4.perspective(90, 800/600, 0.01, 10);
        //mat4.perspective(tempCamera.projectionView, Math.PI/4, 800/600, 0.1, 10);
        this.testPipeline = new UnlitRenderpipeline(this.device, tempCamera, transfromsBuffer);
        const geometry = new GeometryBuilder().createCubeGeometry();
        this.geometryBuffer = new GeometryBuffer(this.device, geometry);

        const image = await Utilities.loadImage("/assets/img/test.jpg");

        this.testPipeline.textureTilling = new Vec2(1, 1);
        this.testPipeline.diffuseTexture = await Texture2D.create(this.device, image);
        this.testPipeline.diffuseColor = Color.white();

    }

    async render(renderables: RenderData){

        const projection = mat4.create();
        mat4.perspective(projection, Math.PI/4, 800/600, 0.1, 10);

        const view = renderables.view_transform;


        this.device.queue.writeBuffer(this.objectBuffer,
            0, renderables.model_transforms,
            0, renderables.model_transforms.length);

        this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
        this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();
        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();

        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments : [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b : 0.25, a : 1.0},
                loadOp : "clear",
                storeOp : "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });

        renderpass.setPipeline(this.pipeline);
        renderpass.setBindGroup(0, this.frameBindGroup);

        var objects_drawn: number = 0;

        // Triangles
        renderpass.setVertexBuffer(0, this.triangleMesh.buffer);

        renderpass.setBindGroup(1, this.triangleMaterial.bindGroup);
        renderpass.draw(
            3, renderables.object_counts[object_types.TRIANGLE], 0, objects_drawn
        );
        objects_drawn += renderables.object_counts[object_types.TRIANGLE];

        // Quads

        renderpass.setVertexBuffer(0, this.quadMesh.buffer);

        renderpass.setBindGroup(1, this.quadMaterial.bindGroup);
        renderpass.draw(
            6, renderables.object_counts[object_types.QUAD], 0, objects_drawn
        );
        objects_drawn += renderables.object_counts[object_types.QUAD];

        // Statue
        renderpass.setVertexBuffer(0, this.statueMesh.buffer);

        renderpass.setBindGroup(1, this.triangleMaterial.bindGroup);
        renderpass.draw(
            this.statueMesh.vertexCount, 1, 0, objects_drawn
        );
        objects_drawn += 1;

        renderpass.end();

        //this.device.queue.submit([commandEncoder.finish()]);
        /// do my test
        const renderPassEncoder : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments : [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b : 0.25, a : 1.0},
                loadOp : "load",
                storeOp : "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });



        //this.angle += 0.01;
        //this.testPipeline.transform = Mat4x4.multiply( Mat4x4.translation(0, 0, 2), Mat4x4.rotationX(this.angle));
        this.testPipeline.draw(renderPassEncoder, this.geometryBuffer, 100);


        renderPassEncoder.end();

        this.device.queue.submit([commandEncoder.finish()]);

    }
    async makeDepthStencilTextureResources()
    {
        this.depthStencilStage = {
            format : "depth24plus-stencil8",
            depthWriteEnabled : true,
            depthCompare : "less"
        };
        const size: GPUExtent3D = {
            width: this.canvas.width,
            height: this.canvas.height,
            depthOrArrayLayers: 1
        }

        const depthTextureDescriptor: GPUTextureDescriptor = {
            size: size,
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }

        this.depthStencilTexture = this.device.createTexture(depthTextureDescriptor);
        const viewDescriptor : GPUTextureViewDescriptor = {
            format: "depth24plus-stencil8",
            dimension: "2d",
            aspect: "all",
        }
        this.depthStencilView = this.depthStencilTexture.createView(viewDescriptor);
        this.depthStencilAttachment = {
            view: this.depthStencilView,
            depthClearValue : 1.0,
            depthLoadOp : "clear",
            depthStoreOp: "store",
            stencilLoadOp : "clear",
            stencilStoreOp: "discard"
        }
    }
}