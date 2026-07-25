import {GeometryBuffers} from "./GeometryBuffers.ts";
import {GeometryBuilder} from "../geometry/GeometryBuilder.ts";

export class GeometryBuffersCollection {
    public static cubeBuffers: GeometryBuffers;

    public static initialize(device: GPUDevice){
        const geometry = new GeometryBuilder().createCubeGeometry();
        this.cubeBuffers = new GeometryBuffers(device, geometry);
    }

}