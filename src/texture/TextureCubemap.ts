

export class TextureCubemap {
    /*
    * Will make it more flexible later
    * */
    public textureCubemap!: GPUTexture;
    public sampler!: GPUSampler;
    private  descriptor: GPUTextureDescriptor;
    constructor(private device: GPUDevice) {
    }

    public static async create(device: GPUDevice){

    }


    private createTextureAndSampler(width: number, height: number) {
        this.descriptor = {
            size: [width, height, 6],
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST |
                GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.RENDER_ATTACHMENT,
            dimension: "2d",
            textureBindingViewDimension: "cube"
        };

        this.textureCubemap = this.device.createTexture(this.descriptor);

        this.sampler = this.device.createSampler({
            magFilter: "linear",
            minFilter: "linear",
        });
    }

    public async initialize(){
        const imgSrcs = [
            '/assets/img/cubemap/px.png',
            '/assets/img/cubemap/nx.png',
            '/assets/img/cubemap/py.png',
            '/assets/img/cubemap/ny.png',
            '/assets/img/cubemap/pz.png',
            '/assets/img/cubemap/nz.png',
        ];

        const promises = imgSrcs.map(async (src) => {
            const response = await fetch(src);
            return createImageBitmap(await response.blob());
        });

        const imageBitmaps = await Promise.all(promises);


        this.createTextureAndSampler(imageBitmaps[0].width, imageBitmaps[0].height);
        for(let i = 0; i < imageBitmaps.length; i++)
        {
            this.device.queue.copyExternalImageToTexture(
                {source: imageBitmaps[i]},
                {texture: this.textureCubemap, origin: [0, 0, i]},
                {width: imageBitmaps[i].width, height: imageBitmaps[i].height}
            );
        }

    }
}