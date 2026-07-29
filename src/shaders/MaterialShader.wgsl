struct VSInput{
    @location(0) position: vec3f,
    @location(1) color: vec4f,
    @location(2) texCoord: vec2f,
    @location(3) normal: vec3f,
}

struct VSOutput{
    @builtin(position) position: vec4f,
    @location(1) color: vec4f,
    @location(2) texCoord: vec2f,
    @location(3) normal: vec3f,
    @location(4) fragPos: vec3f,
    @location(5) eye: vec3f,
    @location(6) lightSpaceFragmentPos: vec4f,
}
@group(0) @binding(0)
var<uniform> transform: array<mat4x4f, 1>;
@group(0) @binding(1)
var<uniform> normalMatrix: array<mat3x3f, 1>;
@group(0) @binding(2)
var<uniform> textureTilling: vec2f;

@group(1) @binding(0)
var<uniform> viewProjection: mat4x4f;
@group(1) @binding(1)
var<uniform> eye: vec3f;
@group(1) @binding(2)
var<uniform> lightSpaceProjectionView: mat4x4f;


@vertex
fn materialVS(in: VSInput, @builtin(vertex_index) vid: u32, @builtin(instance_index) iid: u32) -> VSOutput{
    var out: VSOutput;
    out.position = viewProjection * transform[iid] * vec4f(in.position, 1.0);
    out.color = in.color;
    out.texCoord = in.texCoord * textureTilling;
    out.normal = normalMatrix[iid] * in.normal;
    out.fragPos = (transform[iid] * vec4f(in.position, 1.0)).xyz;
    out.eye = eye;
    out.lightSpaceFragmentPos = lightSpaceProjectionView * vec4f(out.fragPos, 1.0);
    return out;
}
struct AmbientLight{
    @location(0) color: vec3f,
    @location(1) intensity: f32,
};

struct DirectionalLight{
    @location(0) color: vec3f,
    @location(1) intensity: f32,
    @location(2) direction: vec3f,
    @location(3) specularColor: vec3f,
    @location(4) specularIntensity: f32,
};

struct PointLight{
    @location(0) color: vec3f,
    @location(1) intensity: f32,
    @location(2) position: vec3f,
    @location(3) attenConstant: f32,
    @location(4) attenLinear: f32,
    @location(5) attenQuadratic: f32,
    @location(6) specularColor: vec3f,
    @location(7) specularIntensity: f32,
};


@group(2) @binding(0)
var diffuseTexture: texture_2d<f32>;
@group(2) @binding(1)
var diffuseTexSampler: sampler;
@group(2) @binding(2)
var<uniform> diffuseColor: vec4f;
@group(2) @binding(3)
var<uniform> shininess: f32;
@group(2) @binding(4)
var shadowTexture: texture_depth_2d;
@group(2) @binding(5)
var shadowSampler: sampler_comparison;

@group(3) @binding(0)
var<uniform> ambientLight: AmbientLight;
@group(3) @binding(1)
var<uniform> directionalLight: DirectionalLight;
@group(3) @binding(2)
var<uniform> positionalLights: array<PointLight, 3>;


@fragment
fn materialFS(in: VSOutput) -> @location(0) vec4f{
    // - SHADOWS
    // Do a perspective divide
    var shadowCoords = in.lightSpaceFragmentPos.xyz / in.lightSpaceFragmentPos.w;

    // from [-1, 1] to [0, 1]
    var shadowTextureCoords = shadowCoords.xy * 0.5 + 0.5;
    shadowTextureCoords.y = 1 - shadowTextureCoords.y;

    var shadow = textureSampleCompare(shadowTexture, shadowSampler, shadowTextureCoords, shadowCoords.z - 0.01);


    // Vector towards the eye
    var toEye = normalize(in.eye - in.fragPos);

    // AMBIENT
    var lightAmount = ambientLight.color * ambientLight.intensity;

    // DIRECTIONAL LIGHT/ DIFFUSE
    var lightDir = normalize(-directionalLight.direction);
    var n = normalize(in.normal);
    var dotLight = max(dot(n, lightDir), 0);
    lightAmount += directionalLight.color * directionalLight.intensity * dotLight * shadow;

    // SPECULAR LIGHT
    var halfVector = normalize(lightDir + toEye);
    var dotSpecular = max(dot(n, halfVector), 0.0);
    dotSpecular = pow(dotSpecular, shininess);
    lightAmount += directionalLight.specularColor * dotSpecular * directionalLight.specularIntensity * shadow;

    // POINT LIGHT

    for(var i = 0; i < 3; i++){
        var lightDir = normalize(positionalLights[i].position - in.fragPos);
        var dotLight = max(dot(n, lightDir), 0.0);


        var distance = distance(positionalLights[i].position, in.fragPos);
        var attenuation = positionalLights[i].attenConstant + positionalLights[i].attenLinear * distance + positionalLights[i].attenQuadratic * distance * distance;
        attenuation = 1.0/ attenuation;

        lightAmount += positionalLights[i].color * positionalLights[i].intensity * dotLight * attenuation * shadow;

        // SPECULAR LIGHT
        halfVector = normalize(lightDir + toEye);
        dotSpecular = max(dot(n, halfVector), 0.0);
        dotSpecular = pow(dotSpecular, shininess);
        lightAmount += positionalLights[i].specularColor * dotSpecular * positionalLights[i].specularIntensity * shadow;

    }

    var color = textureSample(diffuseTexture, diffuseTexSampler, in.texCoord) * in.color*diffuseColor;

    color = color * vec4f(lightAmount, 1.0);
    return color;
}