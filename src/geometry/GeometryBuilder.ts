import {Geometry} from "./Geometry.ts";
import {ObjLoader} from "./ObjLoader.ts";

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

        let normals = new Float32Array([
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
        ]);

        return new Geometry(vertices, indices, colors, texCoords);
    }

    public createCubeGeometry(): Geometry {

        let vertices = new Float32Array([
            // front
            -0.5, -0.5, -0.5, // bottom left
            -0.5, 0.5, -0.5, // top left
            0.5, -0.5, -0.5, // bottom right
            0.5, 0.5, -0.5, // top right
            // back
            -0.5, -0.5, 0.5, // bottom left
            -0.5, 0.5, 0.5, // top left
            0.5, -0.5, 0.5, // bottom right
            0.5, 0.5, 0.5, // top right

            // left
            -0.5, -0.5, -0.5, // bottom left
            -0.5, 0.5, -0.5, // top left
            -0.5, -0.5, 0.5, // bottom right
            -0.5, 0.5, 0.5, // top right

            // right
            0.5, -0.5, -0.5, // bottom left
            0.5, 0.5, -0.5, // top left
            0.5, -0.5, 0.5, // bottom right
            0.5, 0.5, 0.5, // top right

            // top
            -0.5, 0.5, -0.5, // bottom left
            -0.5, 0.5, 0.5, // top left
            0.5, 0.5, -0.5, // bottom right
            0.5, 0.5, 0.5, // top right

            // bottom
            -0.5, -0.5, -0.5, // bottom left
            -0.5, -0.5, 0.5, // top left
            0.5, -0.5, -0.5, // bottom right
            0.5, -0.5, 0.5, // top right
        ]);

        let indices = new Uint16Array([
            // front
            0, 1, 2,
            1, 3, 2,
            // back
            4, 6, 5,
            5, 6, 7,
            // left
            8, 9, 10,
            9, 11, 10,
            // right
            12, 14, 13,
            13, 14, 15,
            // top
            16, 18, 17,
            17, 18, 19,
            // bottom
            20, 21, 22,
            21, 23, 22
        ]);

        let colors = new Float32Array([
            // front
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            // back
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            // left
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            // right
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            // top
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            // bottom
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1
        ]);

        let texCoords = new Float32Array([
            // front
            0, 1,
            0, 0,
            1, 1,
            1, 0,
            // back
            0, 1,
            0, 0,
            1, 1,
            1, 0,
            // left
            0, 1,
            0, 0,
            1, 1,
            1, 0,
            // right
            0, 1,
            0, 0,
            1, 1,
            1, 0,
            // top
            0, 1,
            0, 0,
            1, 1,
            1, 0,
            // bottom
            0, 1,
            0, 0,
            1, 1,
            1, 0
        ]);

        let normals = new Float32Array([
            // front
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,

            // back
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,

            // left
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,

            // right
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,

            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,

            // bottom
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
        ]);


        return new Geometry(vertices, indices, colors, texCoords, normals);
    }

    public async LoadObjModelGeometry(url: string) {
        const loader = await ObjLoader.create(url);
        const vertices = loader.getVertices();
        const indices = loader.getIndices();
        const vertexCount = vertices.length / 3;
        const colors = new Float32Array(vertexCount * 4).fill(1.0);
        const texCoords = loader.getTexCoords();
        const normals = loader.getNormals();
        console.log("cube:", new Geometry(vertices, indices, colors, texCoords, normals));
        /*
        vertices.length = 72     // 24 vertices × 3
        normals.length = 72      // 24 vertices × 3
        texCoords.length = 48    // 24 vertices × 2
        colors.length = 96       // 24 vertices × 4
        indices.length = 36      // 12 triangles × 3
        * */

        return new Geometry(vertices, indices, colors, texCoords, normals);
    }
}