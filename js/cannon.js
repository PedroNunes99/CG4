/*global THREE, requestAnimationFrame, console*/

var current_cam,cam1,cam2,scene, renderer;

var current_material;


var wire = true;



var geometry, material, mesh;

// movement
var start = Date.now(),delta;

var objs = [];

var edges = 20;

var aproxDepth = 80 ;


var lcalc = true;

var l1on = true, l4on = true, l3on = true, l2on = true;



function createSphere(obj,r,s){
    'use strict';
    var texture = new THREE.TextureLoader().load( 'js/lena.png' );

    material = new THREE.MeshBasicMaterial({map:texture,wireframe:false});
    geometry = new THREE.SphereGeometry(r,s,s);
    mesh = new THREE.Mesh(geometry,material);
    obj.add(mesh);

}   


function createCube(obj,l,d,h,materials){
    'use strict';
    
    geometry=new THREE.CubeGeometry(l,d,h);
    mesh=new THREE.Mesh(geometry,new THREE.MeshFaceMaterial(materials));

    obj.add(mesh);

}

function onResize() {
    'use strict';


    renderer.setSize(window.innerWidth, window.innerHeight);

    if (current_cam == cam2) {

        if (window.innerHeight > 0 && window.innerWidth > 0) {
            
            current_cam.aspect = window.innerWidth / window.innerHeight;
            current_cam.updateProjectionMatrix();
        }
    }
    else {
        if (window.innerHeight > 0 && window.innerWidth > 0) {
            var camFactor = 40;
            
            current_cam.left = -window.innerWidth / camFactor;
            current_cam.right = window.innerWidth / camFactor;
            current_cam.top = window.innerHeight / camFactor;
            current_cam.bottom = -window.innerHeight / camFactor;
            current_cam.updateProjectionMatrix();
        }

    }

}





class Entity extends THREE.Object3D{
    constructor(x,y,z){
        super();
        this.position.set(x,y,z);
    }



}

class Ball extends Entity{
    constructor(x,y,z,r){
        super(x,y,z);
        createSphere(this,r,edges);


        

    }
}

class Dice extends Entity{
    constructor(x,y,z,l){
        super(x,y,z);
        var texture = new THREE.TextureLoader();
        var texts =  [];
        var materials = [];
        for(let i = 1; i<=6; i++){
            texts[i-1] = texture.load('js/' + i +'.jpg');

            materials.push(new THREE.MeshBasicMaterial({map: texts[i-1]}));
        }
        createCube(this,l,l,l,materials);
    }
}

class Board extends Entity{
    constructor(x,y,z,l,d,h){
        super(x,y,z);
        var texture = new THREE.TextureLoader();
        var texts =  [];
        var materials = [];
        var wood = texture.load('js/wood.jpg');
        var b = texture.load('js/board.png');
        for(let i = 0; i<2; i++){
            materials.push(new THREE.MeshBasicMaterial({map: wood}));
        }
        materials.push(new THREE.MeshBasicMaterial({map: b}));
        for(let i = 3; i<6; i++){
            materials.push(new THREE.MeshBasicMaterial({map: wood}));
        }
        createCube(this,l,d,h,materials);
    }
}


function render(){
    'use strict';
    renderer.render(scene,current_cam);

}

function createCamera1(){
    'use strict';
    cam1 = new THREE.OrthographicCamera( window.innerWidth / - aproxDepth, window.innerWidth / aproxDepth, window.innerHeight / aproxDepth, window.innerHeight / -aproxDepth, - 500, 1000);

    cam1.position.set(-12.5,30,25);
    cam1.lookAt(new THREE.Vector3(-12.5,30,0));
}

function createCamera2(){
    'use strict';
    cam2 = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );

    cam2.position.x = 40;
    cam2.position.y = 45;
    cam2.position.z = 80;
    cam2.lookAt(new THREE.Vector3(0,25,-25));    
}


function dirLightSwitcher() {
	dirLight.visible = !dirLight.visible;
}


var axis;
var board,dice,ball;
function createScene(){
    'use strict';

    scene=new THREE.Scene();

    axis = new THREE.AxisHelper(10,10,10);
    scene.add(axis);

    board = new Board(0,0,0,50,5,50);
    dice = new Dice(0,20,0,5);
    ball = new Ball(10,20,0,2);
    
    scene.add(board);
    scene.add(dice);
    scene.add(ball);
}



var basic = false,shade = false,lights = false;
var l1 = false,l2 = false,l3 = false,l4 = false;
function onKeyDown(e) {
    'use strict';

    switch (e.keyCode) {
    case 49: //1
        l1 = true;
        break;
    case 50: //2
        l2 = true;
        break;
    case 51: //3
        l3 = true;
        break;
    case 52: //4
        l4 = true;
        break;
    case 53: //5
        current_cam = cam1;
        break;
    case 54: //6
        current_cam = cam2;
        break;    
    case 81:  //Q
    case 113:  //q
        lights = true;
        break;
    case 87:  //W
    case 119:  //w
        basic = true;
        break;    
    case 69:  //E
    case 101: //e
        shade = true;
        break;
    }
}

function init(){
    'use strict';

    renderer = new THREE.WebGLRenderer({antialias:true});

    renderer.setSize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.domElement);


    createScene();

    createCamera1();
    createCamera2();
    current_cam = cam2;


    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);

    render();
}



var time = 0;
function animate() {
    'use strict';
    
    
    delta = Date.now() - start;
    time = delta - time;



    time = delta;
    render();

    requestAnimationFrame(animate);
}