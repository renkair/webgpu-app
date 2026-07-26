    import {vec2, vec3} from "gl-matrix";

    export class ObjLoader{
        v: vec3[];
        vt: vec2[];
        vn: vec3[];
        vertices: vec3[];
        indices: number[] = [];
        texCoords: vec2[];
        normals: vec3[];

        public getVertices(): Float32Array{
            return new Float32Array(this.vertices.flatMap(v=>[v[0], v[1], v[2]]));  // flat vec3[] to float32Array
        }
        public getTexCoords(): Float32Array{
            return new Float32Array(this.texCoords.flatMap(vt=>[vt[0], vt[1]]));
        }
        public  getNormals(): Float32Array{
            return new Float32Array(this.normals.flatMap(vn=>[vn[0], vn[1], vn[2]]));
        }
        public getIndices(): Uint16Array{
            return new Uint16Array(this.indices);
        }

        constructor() {
            this.v = [];
            this.vt = [];
            this.vn = [];

            this.vertices = [];
            this.texCoords = [];
            this.normals = [];
        }

        public static async create(url: string){
            const loader = new ObjLoader();
            await loader.read_file(url);
            return loader;
        }


        async read_file(url: string)
        {
            const response: Response = await fetch(url);
            const blob: Blob = await response.blob();
            const file_contents = await blob.text();
            const lines = file_contents.split("\n");

            lines.forEach(line => {
                if(line[0] == 'v' && line[1] == ' '){
                    this.read_vertex_line(line);
                }
                else if(line[0] == 'v' && line[1] == 't'){
                    this.read_texcoord_line(line);
                }
                else if(line[0] == 'v' && line[1] == 'n'){
                    this.read_normal_line(line);
                }
                else if(line[0] == 'f'){
                    this.read_face_line(line);
                }


            })


        }

        read_vertex_line(line: string)
        {
            const components = line.split(" ");
            const new_vertex: vec3 = [
                Number(components[1]).valueOf()*0.1,
                Number(components[2]).valueOf()*0.1,
                Number(components[3]).valueOf()*0.1,
            ]
            this.v.push(new_vertex);
        }
        read_texcoord_line(line: string)
        {
            // vt, u, v
            const components = line.split(" ");
            const new_texcoord: vec3 = [
                Number(components[1]).valueOf(),
                Number(components[2]).valueOf(),
            ]
            this.vt.push(new_texcoord);

        }
        read_normal_line(line: string)
        {
            // vn, nx, ny, nz
            const components = line.split(" ");
            const new_normal: vec3 = [
                Number(components[1]).valueOf(),
                Number(components[2]).valueOf(),
                Number(components[3]).valueOf(),
            ]
            this.vn.push(new_normal);
        }
        read_face_line(line: string)
        {
            // f,
            line.replace("\n", "");
            const vertex_descriptions = line.split(" ");

            for(var i = 1; i < 4; i++) // start index with 1 to skip 'f'
            {
                this.read_corner(vertex_descriptions[i]);
                //console.log(vertex_descriptions[i]);
            }


        }

        read_corner(vertex_description: string) {
            //console.log({ vertex_description, v_len: this.v.length, vt_len: this.vt.length });
            if(vertex_description == "\r")
                return;

            const v_vt_vn = vertex_description.split("/");
            //console.log(v_vt_vn); // array [3, 3, 1]

            const vertexIndex = Number(v_vt_vn[0]) - 1;
            const texCoordIndex = Number(v_vt_vn[1]) - 1;
            const normalIndex = Number(v_vt_vn[2]) - 1;

            this.vertices.push(this.v[vertexIndex]);
            this.texCoords.push(this.vt[texCoordIndex]);
            this.normals.push(this.vn[normalIndex]);

            this.indices.push(this.vertices.length - 1);
        }
    }