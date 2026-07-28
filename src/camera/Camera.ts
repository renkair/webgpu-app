import  {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import  {Mat4x4} from "../math/Mat4x4.ts";
import {Vec3} from "../math/Vec3.ts";

export class Camera {
    public buffer: UniformBuffer;
    public skyboxBuffer: UniformBuffer; // provide for skybox shader

    // VIEW PROPERTIES
    public eye = new Vec3(-15, 0, -3);
    public target = new Vec3(0, 0, 0);
    public up = new Vec3(0, 1, 0);

    // PERSPECTIVE PROPERTIES
    public fov = 60;
    public near = 0.01;
    public far = 100;

    // MATRICES
    private perspective = Mat4x4.identity();
    private view = Mat4x4.identity();

    private projectionView : Mat4x4 = Mat4x4.identity();


    constructor(device: GPUDevice, private aspectRatio: number) {
        this.buffer = new UniformBuffer(device, this.projectionView, "Camera Buffer");
        this.skyboxBuffer = new UniformBuffer(device, 16 * Float32Array.BYTES_PER_ELEMENT, "Skybox Buffer");
    }

    public update()
    {
        this.view = Mat4x4.lookAt(this.eye, this.target, this.up);
        this.perspective = Mat4x4.perspective(this.fov, this.aspectRatio, this.near, this.far);
        this.projectionView = Mat4x4.multiply(this.perspective, this.view);

        this.buffer.update(this.projectionView);

        // vec3<f32> required alignment 16 bytes
        const skyboxData = new Float32Array([
            this.getForward().x, this.getForward().y, this.getForward().z, 0,
            this.getRight().x, this.getRight().y, this.getRight().z, 0,
            this.up.x, this.up.y, this.up.z, 0,
        ]);

        this.skyboxBuffer.update(skyboxData);
    }

    public getForward()
    {
        const forward = Vec3.normalize(Vec3.subtract(this.target, this.eye));
        return forward;
    }

    public getRight(){
        const right = Vec3.normalize(Vec3.cross( this.up, this.getForward()));
        return right;
    }

}