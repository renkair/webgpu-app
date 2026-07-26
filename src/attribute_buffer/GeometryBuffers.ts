import type {Geometry} from "../geometry/Geometry.ts";

export class GeometryBuffers {
    public readonly positionBuffer: GPUBuffer;
    public readonly indicesBuffer?: GPUBuffer;
    public readonly vertexCount: number;
    public readonly indexCount?: number;
    public readonly colorBuffer: GPUBuffer;
    public readonly texCoordsBuffer: GPUBuffer;
    public readonly normalsBuffer: GPUBuffer;


    constructor(device: GPUDevice, geometry: Geometry) {
        console.log(geometry);
        // POSITIONS
        this.positionBuffer = device.createBuffer({
            label: "Position Buffer",
            size: geometry.positions.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.positionBuffer, 0,
            geometry.positions.buffer, 0,
            geometry.positions.byteLength);

        this.vertexCount = geometry.positions.length / 3;

        // INDICES
        if(geometry.indices.length > 0){
            //console.log("indices buffer");
            this.indicesBuffer = device.createBuffer({
                label: "index Buffer",
                size: geometry.indices.byteLength,
                usage: GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST,
            });

            device.queue.writeBuffer(this.indicesBuffer, 0,
                geometry.indices.buffer, 0,
                geometry.indices.byteLength);

            this.indexCount = geometry.indices.length;
        }

        // COLORs
        this.colorBuffer = device.createBuffer({
            label: "Color Buffer",
            size: geometry.colors.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.colorBuffer, 0,
            geometry.colors.buffer, 0,
            geometry.colors.byteLength);

        // TEXCOORDs
        this.texCoordsBuffer = device.createBuffer({
            label: "texCoords Buffer",
            size: geometry.texCoords.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.texCoordsBuffer, 0,
            geometry.texCoords.buffer, 0,
            geometry.texCoords.byteLength);


        // NORMALs
        this.normalsBuffer = device.createBuffer({
            label: "normals Buffer",
            size: geometry.normals.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        device.queue.writeBuffer(this.normalsBuffer, 0,
            geometry.normals.buffer, 0,
            geometry.normals.byteLength);

        
    }
}
