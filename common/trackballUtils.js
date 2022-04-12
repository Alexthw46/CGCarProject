l  = -1;
r  =  1;
b  = -1;
t  =  1;
n  =  1;
f  = 15;

/* trackball */
let rotating = false;
let start_point = [0,0,0];
let trackball_center = [0,0,-10];
let trackball_matrix = glMatrix.mat4.create();
let scaling_factor = 1.0;

let trackball_rotation = glMatrix.mat4.create();
let trackball_scaling = glMatrix.mat4.create();

ray_sphere_intersection = function (r,radius,dz){

    let a = r[0] * r[0] + r[1] * r[1] + r[2] * r[2];

    let b = -2 * dz * r[2];
    let c = dz * dz - radius * radius;

    let dis = b * b - 4 * a * c;

    if(dis > 0){
        let t0 = (-b - Math.sqrt(dis)) / (2 * a);
        let t1 = (-b + Math.sqrt(dis)) / (2 * a);
        let t = Math.min(t0, t1);
        return [true,[t*r[0],t*r[1],t*r[2]]];
    }else
        return [false,[0,0,0]];
}

ray_from_click = function(x,y){
    let px = l + (x / 500.0) * (r - l);
    let py = b + ((500 - y) / 500.0) * (t - b);
    let pz = -n;
    return [px,py,pz];
}

point_on_sphere = function (x,y){
    const ray = ray_from_click(x, y);
    return ray_sphere_intersection(ray,5,-7.5);
}