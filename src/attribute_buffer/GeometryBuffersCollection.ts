import {GeometryBuffers} from "./GeometryBuffers.ts";
import {GeometryBuilder} from "../geometry/GeometryBuilder.ts";

export class GeometryBuffersCollection {
    public static cubeBuffers: GeometryBuffers;
    public static bunnyBuffers: GeometryBuffers;
    public static async initialize(device: GPUDevice){
        const builder = new GeometryBuilder();
        const geometry = builder.createCubeGeometry();
        this.cubeBuffers = new GeometryBuffers(device, geometry);

        const bunnyGeometry = await builder.LoadObjModelGeometry("/assets/3dmodel/lowpolyBunny.obj");
        this.bunnyBuffers = new GeometryBuffers(device, bunnyGeometry);

    }

}