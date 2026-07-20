export class Mat4x4 extends Float32Array{
    constructor() {
        super([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
    }
    public static identity(): Mat4x4
    {
        return new Mat4x4();
    }
    public static createTranslationMatrix(x: number, y: number, z: number): Mat4x4{
        const m : Mat4x4 = new Mat4x4();
        m.set([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
        ]);

        return m;
    }

    public static createScaleMatrix(x: number, y: number, z: number): Mat4x4{
        const m : Mat4x4 = new Mat4x4();
        m.set([
            x, 0, 0, 0,
            0, y, 0, 0,
            0, 0, z, 0,
            0, 0, 0, 1,
        ]);

        return m;
    }

    public static createRotationMatrixZ(angle: number){
        const s = Math.sin(angle);
        const c = Math.cos(angle);

        const m = new Mat4x4();
        m.set([
            c, -s, 0, 0,
            s, c, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        ]);
        return m;
    }
}