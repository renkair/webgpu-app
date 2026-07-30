import  {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import  {Mat4x4} from "../math/Mat4x4.ts";
import {Vec3} from "../math/Vec3.ts";
import type {vec3} from "gl-matrix";
import {MathUtil} from "../math/MathUtil.ts";

export class Camera {
    public buffer: UniformBuffer;
    public skyboxBuffer: UniformBuffer; // provide for skybox shader
    public eyeBuffer: UniformBuffer; // provide for material shader specular

    // VIEW PROPERTIES
    public eye = new Vec3(-15, 0, -3);
    public target = new Vec3(0, 0, 0);


    // PERSPECTIVE PROPERTIES
    public fov = 60;
    public near = 0.01;
    public far = 100;

    // MATRICES
    private perspective = Mat4x4.identity();
    private view = Mat4x4.identity();

    private projectionView : Mat4x4 = Mat4x4.identity();




    constructor(device: GPUDevice, private aspectRatio: number, public pitch : number, public yaw : number) {
        this.buffer = new UniformBuffer(device, this.projectionView, "Camera Buffer");
        this.skyboxBuffer = new UniformBuffer(device, 16 * Float32Array.BYTES_PER_ELEMENT, "Skybox Buffer");
        this.eyeBuffer = new UniformBuffer(device, 4 * Float32Array.BYTES_PER_ELEMENT, "Eye Buffer");
    }

    public update()
    {
        const forward = this.getForward();
        this.target = Vec3.add(this.eye, forward);

        const worldUp = new Vec3(0, 1, 0);
        this.view = Mat4x4.lookAt(this.eye, this.target, worldUp);
        this.perspective = Mat4x4.perspective(this.fov, this.aspectRatio, this.near, this.far);
        this.projectionView = Mat4x4.multiply(this.perspective, this.view);

        this.buffer.update(this.projectionView);

        // vec3<f32> required alignment 16 bytes
        const skyboxData = new Float32Array([
            this.getForward().x, this.getForward().y, this.getForward().z, 0,
            this.getRight().x, this.getRight().y, this.getRight().z, 0,
            worldUp.x, worldUp.y, worldUp.z, 0,
        ]);

        this.skyboxBuffer.update(skyboxData);

        // EYE BUFFER
        const eyeData = new Float32Array([
           this.eye.x, this.eye.y, this.eye.z, 0,
        ]);
        this.eyeBuffer.update(eyeData);
    }

    public getForward()
    {
        //const forward = Vec3.normalize(Vec3.subtract(this.target, this.eye));
        const forward = new Vec3();
        forward.x = Math.cos(MathUtil.toRadians(this.yaw)) * Math.cos(MathUtil.toRadians(this.pitch));
        forward.y = Math.sin(MathUtil.toRadians(this.pitch));
        forward.z = Math.sin(MathUtil.toRadians(this.yaw)) * Math.cos(MathUtil.toRadians(this.pitch));
        return forward;
    }

    public getRight(){
        const worldUp = new Vec3(0, 1, 0);
        const right = Vec3.normalize(Vec3.cross( worldUp, this.getForward()));
        return right;
    }

    public getUp(){
        return Vec3.cross(this.getRight(), this.getForward());
    }

}