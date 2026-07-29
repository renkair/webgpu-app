import  {UniformBuffer} from "../uniform_buffers/UniformBuffer.ts";
import  {Mat4x4} from "../math/Mat4x4.ts";
import {Vec3} from "../math/Vec3.ts";

export class ShadowCamera {
    public buffer: UniformBuffer;


    // VIEW PROPERTIES
    public eye = new Vec3(-15, 0, -3);
    public target = new Vec3(0, 0, 0);
    public up = new Vec3(0, 1, 0);

    // ORTHOGAPHIC PROPERTIES
    public near = 0.01;
    public far = 100;

    // MATRICES
    private perspective = Mat4x4.identity();
    private view = Mat4x4.identity();

    private projectionView : Mat4x4 = Mat4x4.identity();


    constructor(device: GPUDevice) {
        this.buffer = new UniformBuffer(device, this.projectionView, "Shadow Camera Buffer");
    }

    public update()
    {
        this.view = Mat4x4.lookAt(this.eye, this.target, this.up);
        this.perspective = Mat4x4.orthographic(-10, 10, -10, 10, this.near, this.far);
        this.projectionView = Mat4x4.multiply(this.perspective, this.view);

        this.buffer.update(this.projectionView);
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