import {Geometry} from "./Geometry.ts";

export class GeometryBuilder{
    public createQuadGeometry(): Geometry{
        let vertices = new Float32Array([
            -0.5, -0.5, 0.0,
            -0.5, 0.5, 0.0,
            0.5, -0.5, 0.0,
            0.5, 0.5, 0.0,
        ]);
        let indices = new Uint16Array([
            0, 1, 2,
            1, 3, 2
        ]);
        let colors = new Float32Array([
            1,1,1,1,
            1,1,1,1,
            1,1,1,1,
            1,1,1,1,
        ]);

        let texCoords = new Float32Array([
            0, 1,
            0, 0,
            1, 1,
            1, 0,
        ]);
        return new Geometry(vertices, indices, colors, texCoords);
    }
}