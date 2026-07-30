import {UnlitRenderpipeline} from "./pipelines/UnlitRenderpipeline.ts";
import {Utilities} from "./Utilities.ts";
import {Texture2D} from "./texture/Texture2D.ts";
import {Color} from "./math/Color.ts";
import {Mat4x4} from "./math/Mat4x4.ts";
import {Camera} from "./camera/Camera.ts";
import {UniformBuffer} from "./uniform_buffers/UniformBuffer.ts";
import {Vec3} from "./math/Vec3.ts";
import {GeometryBuffersCollection} from "./attribute_buffer/GeometryBuffersCollection.ts";
import {Bunny} from "./game_objects/Bunny.ts";
import {AmbientLight} from "./lights/AmbientLight.ts";
import {DirectionalLight} from "./lights/DirectionalLight.ts";
import {PointLightsCollection} from "./lights/PointLight.ts";
import {Wall} from "./game_objects/Wall.ts";
import {Ground} from "./game_objects/Ground.ts";
import {Skybox} from "./game_objects/Skybox.ts";
import {TextureCubemap} from "./texture/TextureCubemap.ts";
import {ShadowCamera} from "./camera/ShadowCamera.ts";


export class Renderer {
    canvas: HTMLCanvasElement;

    // device/context object
    adapter: GPUAdapter;
    device: GPUDevice;
    context: GPUCanvasContext;
    format: GPUTextureFormat;

    // Pipeline Objects

    // depth stencil stuff
    depthStencilStage: GPUDepthStencilState;
    depthStencilTexture: GPUTexture;
    depthStencilView: GPUTextureView;
    depthStencilAttachment: GPURenderPassDepthStencilAttachment;

    shadowTexture : Texture2D;

    // LIGHT
    ambientLight: AmbientLight;
    directionalLight: DirectionalLight;
    pointlights: PointLightsCollection;

    //Scene OBJ
    bunny1: Bunny;
    camera: Camera;
    shadowCamera: ShadowCamera;
    wall: Wall;
    ground: Ground;
    skybox: Skybox;


    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
    }

    async Initialize(){
        await this.setupDevice();

        await this.createAsset();

        await this.makeDepthStencilTextureResources();

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



    async createAsset(){

        await GeometryBuffersCollection.initialize(this.device);

        // - transfroms buffer
        const transfromsBuffer = new UniformBuffer(this.device, 100 * Mat4x4.BYTE_SIZE, "transforms Buffer");
        const transforms: Array<Mat4x4> = [];

        const transfromMatrix = Mat4x4.translation(
            0, 0,  0,
        );
        transforms.push(transfromMatrix);
        transfromsBuffer.update(transfromMatrix, /*Buffer offset*/ 0*Mat4x4.BYTE_SIZE);

        // CAMERA
        this.camera = new Camera(this.device, this.canvas.width/ this.canvas.height, 0, 0);
        const view = Mat4x4.lookAt2(this.camera.eye, this.camera.target, this.camera.getUp());
        const perspective = Mat4x4.perspective(45, 800/600, 0.01, 10);
        this.camera.projectionView = Mat4x4.multiply(perspective, view);

        this.shadowCamera = new ShadowCamera(this.device);
        this.shadowCamera.eye = new Vec3(0, 0, -20); // assume it is directional light position


        // LIGHTS
        this.ambientLight = new AmbientLight(this.device);
        this.ambientLight.color = new Color(1, 1, 1);
        this.ambientLight.intensity = 0.34;

        this.directionalLight = new DirectionalLight(this.device);
        this.directionalLight.color = new Color(1, 1, 1, 1);
        this.directionalLight.intensity = 1;
        this.directionalLight.direction = new Vec3(0, 0, 1);
        this.directionalLight.specularColor = new Color(1, 1, 1, 1);
        this.directionalLight.specularIntensity = 19;

        this.pointlights = new PointLightsCollection(this.device);
        this.pointlights.lights[0].color = new Color(1, 0, 0, 1);
        this.pointlights.lights[0].intensity = 2;
        this.pointlights.lights[0].position = new Vec3(4, 2, 0);
        this.pointlights.lights[0].specularColor = new Color(1, 1, 1, 1);
        this.pointlights.lights[0].specularIntensity = 4;
        this.pointlights.lights[1].color = new Color(0, 1, 0, 1);
        this.pointlights.lights[1].intensity = 2;
        this.pointlights.lights[1].position = new Vec3(-4, 2, 0);
        this.pointlights.lights[1].specularColor = new Color(1, 1, 1, 1);
        this.pointlights.lights[1].specularIntensity = 3;
        this.pointlights.lights[2].color = new Color(0, 0, 1, 1);
        this.pointlights.lights[2].intensity = 2;
        this.pointlights.lights[2].position = new Vec3(2, -1, 0);



        // CREATE GAME OBJECTs
        const image = await Utilities.loadImage("/assets/img/WhiteTexture.png");
        const texture = await Texture2D.create(this.device, image);
        //const textrue = await Texture2D.createEmpty(this.device);


        this.shadowTexture = Texture2D.createShadowTexture(this.device, this.canvas.width, this.canvas.height);

        // - BUNNY
        this.bunny1 = new Bunny(this.device, this.camera, this.shadowCamera, texture, this.ambientLight, this.directionalLight, this.pointlights);
        this.bunny1.position.y = -5;
        this.bunny1.pipeline.shadowTexture = this.shadowTexture;
        // - WALL
        this.wall = new Wall(this.device, this.camera, this.shadowCamera, texture, this.ambientLight, this.directionalLight, this.pointlights);
        this.wall.position = new Vec3(0, 0, 1);
        this.wall.pipeline.shadowTexture = this.shadowTexture;

        const groundImage = await Utilities.loadImage("/assets/img/texture_07.png");
        const groundTexture = await Texture2D.create(this.device, groundImage);
        this.ground = new Ground(this.device, this.camera, this.shadowCamera, groundTexture, this.ambientLight, this.directionalLight, this.pointlights);
        this.ground.pipeline.shadowTexture = this.shadowTexture;

        // - SKYBOX
        const textureCubemap = new TextureCubemap(this.device);
        await textureCubemap.initialize();
        if (!textureCubemap) {
            console.log("error to creat cubemap");
        }
        this.skybox = new Skybox(this.device, this.camera, textureCubemap);



    }


    shadowPass = (commandEncoder: GPUCommandEncoder) => {
        const renderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [],
            // CONFIGURE DEPTH
            depthStencilAttachment: {
                view: this.shadowTexture.texture.createView(),
                depthLoadOp : "clear",
                depthStoreOp : "store",
                depthClearValue : 1.0,
                stencilReadOnly : true,
            },
        });

        // DRAW HERE
        this.bunny1.drawShadows(renderPassEncoder);

        renderPassEncoder.end();
    }

    scenePass = (commandEncoder: GPUCommandEncoder) => {
        const textureView : GPUTextureView = this.context.getCurrentTexture().createView();
        const renderPassEncoder : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments : [{
                view: textureView,
                clearValue: {r: 0, g: 0.5, b : 0.5, a : 1.0},
                loadOp : "clear",
                storeOp : "store"
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });


        //// UPDATE
        this.camera.update();
        this.shadowCamera.update();
        this.bunny1.update();
        this.ambientLight.update();
        this.directionalLight.update();
        this.pointlights.update();
        this.wall.update();
        this.ground.update();
        this.skybox.update();

        this.bunny1.draw(renderPassEncoder);
        this.ground.draw(renderPassEncoder);
        this.skybox.draw(renderPassEncoder);
        //this.wall.draw(renderPassEncoder);


        renderPassEncoder.end();
    }

    async render(){

        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();

        this.scenePass(commandEncoder);

        this.shadowPass(commandEncoder);

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
    // TODO: create a new class handle this.
    moveCamera(forwards_amount: number, right_amount: number){
        this.camera.eye = Vec3.add(this.camera.eye, new Vec3(this.camera.getForward().x * forwards_amount,
            this.camera.getForward().y * forwards_amount,
            this.camera.getForward().z * forwards_amount));

        this.camera.eye = Vec3.add(this.camera.eye, new Vec3(this.camera.getRight().x * right_amount,
            this.camera.getRight().y * right_amount,
            this.camera.getRight().z * right_amount));
    }

    spinCamera(pitch: number, yaw: number)
    {
        this.camera.pitch += pitch;
        this.camera.yaw += yaw;
        if(this.camera.pitch > 89.0)
            this.camera.pitch =  89.0;
        if(this.camera.pitch < -89.0)
            this.camera.pitch = -89.0;
    }


}