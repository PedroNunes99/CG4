/*global THREE, requestAnimationFrame, console*/

var current_cam,cam1,cam2,scene, renderer;

var next_cam = 1;
var next_material = 1;


var wire = false;



var geometry, material, mesh;

// movement
var start = Date.now(),delta;

var objs = [];

var edges = 20;

var aproxDepth = 80 ;

var w = window.innerWidth,h = window.innerHeight;



function createPause(x,y,z,w,h){
    geometry = new THREE.PlaneGeometry( w, h, edges);
    var texture = new THREE.TextureLoader().load( 'js/pause.jpeg' );
    material = new THREE.MeshBasicMaterial( {map:texture,color:'white',side: THREE.DoubleSide} );
    var plane = new THREE.Mesh( geometry, material );
    plane.position.set(x,y,z);
    plane.rotation.x = -Math.PI / 2;
    scene.add( plane );
}

function createSphere(obj,x,y,z,r,s,material){
    'use strict';

    geometry = new THREE.SphereGeometry(r,s,s);
    mesh = new THREE.Mesh(geometry,material);
    mesh.position.set(x,y,z);
    obj.add(mesh);

}   


function createCube(obj,l,d,h,rx,ry,rz,material){
    'use strict';
    
    geometry=new THREE.CubeGeometry(l,d,h);
    mesh=new THREE.Mesh(geometry,material);
    mesh.rotation.set(rx,ry,rz);
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
            var camFactor = 80 * ((window.innerHeight + window.innerWidth) / (w + h));
            
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

    changeWire(){
        this.children[0].material.wireframe = !this.children[0].material.wireframe;
    }

}
var a;
class Ball extends Entity{
    constructor(x,y,z,r,acc,maxsp){
        super(0,0,0);
        this.mats = []
        this.paused = false;
        //a = new THREE.AxisHelper(10,10,10);
        
        var texture = new THREE.TextureLoader().load( 'js/lena.png' );

        this.mats.push(new THREE.MeshPhongMaterial({shininess : 120, map : texture}));
        this.mats.push(new THREE.MeshBasicMaterial({map : texture}));
        this.mats.push(new THREE.MeshBasicMaterial({color:'pink',wireframe: true}));

        this.maxSpeed = maxsp;
        this.acc = acc;
        
        this.initSpeed = 0;


        createSphere(this,x,y,z,r,edges,this.mats[0]);
        //this.children[0].add(a);
    }

    pause(){
        this.paused = true;
    }

    resume(){
        this.paused = false;
    }

    reset(){
        this.acc = Math.sqrt(this.acc * this.acc);
        this.rotation.y = 0;
        this.rotation.z = 0;
        this.rotation.x = 0;
        this.children[0].rotation.x = 0;
        this.children[0].rotation.y = 0;
        this.children[0].rotation.z = 0;
        this.initSpeed = 0;
        this.changeMat(0);
    }
    rotateAroundItself(delta){
        if(!this.paused){
            this.initSpeed += this.acc * delta;
            if (this.initSpeed > this.maxSpeed){
                this.initSpeed = this.maxSpeed;
            }
            if (this.initSpeed < 0){
                this.initSpeed = 0;
            }

            this.children[0].rotateX(-delta * this.initSpeed);
            this.rotateY(delta * this.initSpeed * 0.7);
        }

    }

    // 0 - Phong , 1- Basic, 2 - wire
    changeMat(flag){
        this.children[0].material = this.mats[flag];
    }

}

class Dice extends Entity{
    constructor(x,y,z,l,rx,ry,rz,rotsp){
        super(x,y,z);
        this.rotationalSpeed = rotsp; 
        this.mats = [];
        var texture = new THREE.TextureLoader();
        var texts =  [];
        var materials1 = [];
        var materials2 = [];
        this.paused = false;

        for(let i = 1; i<=6; i++){
            texts[i-1] = texture.load('js/' + i +'.jpg');
            var bmap = texture.load('js/'+ i +'bm.jpg');

            materials1.push(new THREE.MeshPhongMaterial({bumpMap:bmap,map: texts[i-1]}));
        }

        this.mats.push(new THREE.MeshFaceMaterial(materials1));

        for(let i = 1; i<=6; i++){
            texts[i-1] = texture.load('js/' + i +'.jpg');
            var bmap = texture.load('js/'+ i +'bm.jpg');

            materials2.push(new THREE.MeshBasicMaterial({map: texts[i-1]}));
        }
        this.mats.push(new THREE.MeshFaceMaterial(materials2));
        this.mats.push(new THREE.MeshBasicMaterial({color:'red',wireframe: true}));
        createCube(this,l,l,l,rx,ry,rz,this.mats[0]);
    }

    pause(){
        this.paused = true;
    }

    resume(){
        this.paused = false;
    }

    reset(){
        this.rotation.y = 0;
        this.changeMat(0);
    }

    rotate(delta){
        if(!this.paused){
            this.rotation.y += delta*this.rotationalSpeed;
        }
    }
    // 0 - Phong , 1- Basic
    changeMat(flag){
        this.children[0].material = this.mats[flag];
    }
}

class Board extends Entity{
    constructor(x,y,z,rx,ry,rz,l,d,h){
        super(x,y,z);
        this.mat = [];
        var texture = new THREE.TextureLoader();
        var materials1 = [];
        var materials2 = [];
        var wood = texture.load('js/wood.jpg');
        var b = texture.load('js/board.png');
        var bmap = texture.load('js/woodbm.jpg');
        for(let i = 0; i<2; i++){
            materials1.push(new THREE.MeshPhongMaterial({bumpMap:bmap,map: wood}));
        }
        materials1.push(new THREE.MeshPhongMaterial({bumpMap:bmap,bumpScale:0.8,map: b}));
        for(let i = 3; i<6; i++){
            materials1.push(new THREE.MeshPhongMaterial({bumpMap:bmap,map: wood}));
        }
        this.mat.push(new THREE.MeshFaceMaterial(materials1));

        for(let i = 0; i<2; i++){
            materials2.push(new THREE.MeshBasicMaterial({map: wood}));
        }
        materials2.push(new THREE.MeshBasicMaterial({map: b}));
        for(let i = 3; i<6; i++){
            materials2.push(new THREE.MeshBasicMaterial({map: wood}));
        }
        this.mat.push(new THREE.MeshFaceMaterial(materials2));
        this.mat.push(new THREE.MeshBasicMaterial({color:'white',wireframe: true}));
        createCube(this,l,d,h,rx,ry,rz,this.mat[0]);
    }

     // 0 - Phong , 1- Basic
     changeMat(flag){
        this.children[0].material = this.mat[flag];
    }
    
    reset(){
        this.changeMat(0);
    }
}


function render(){
    'use strict';
    renderer.render(scene,current_cam);

}

function createCamera1(){
    'use strict';
    cam1 = new THREE.OrthographicCamera( window.innerWidth / - aproxDepth, window.innerWidth / aproxDepth, window.innerHeight / aproxDepth, window.innerHeight / -aproxDepth, - 500, 1000);

    cam1.position.set(200,50,0);
    cam1.lookAt(new THREE.Vector3(200,0,0));
}

function createCamera2(){
    'use strict';
    cam2 = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );

    cam2.position.x = 30;
    cam2.position.y = 35;
    cam2.position.z = 50;
    cam2.lookAt(new THREE.Vector3(0,0,0));    
}


function dirLightSwitcher() {
	dirLight.visible = !dirLight.visible;
}


var axis;
var board,dice,ball;
var pointLight,dirLight;
function createScene(){
    'use strict';

    scene=new THREE.Scene();

    //axis = new THREE.AxisHelper(10,10,10);
    //scene.add(axis);

    board = new Board(0,-8.2,0,0,0,0,60,5,60);
    dice = new Dice(0,0,0,7,Math.PI/4 - 0.15,0,Math.PI/4,2);
    ball = new Ball(20,0,0,6,0.5,4);

    dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    dirLight.position.set(30,30,30);
    scene.add(dirLight.target);
    dirLight.target = dice;
    scene.add( dirLight );

    pointLight = new THREE.PointLight( 0xffffff, 1, 100 );
    pointLight.position.set( 30, 30, 30 );
    scene.add( pointLight );

    createPause(200,0,0,50,30);

    
    scene.add(board);
    scene.add(dice);
    scene.add(ball);
}


var keyb = false,keyd = false, keyp = false, keyw = false, keyl = false, keys = false, keyr = false;
function onKeyDown(e) {
    'use strict';
    //d,p,w,l,s,r
    switch (e.keyCode) {
    case 66: //B
    case 98: //b
        keyb = true;
        break;
    case 68: //D
    case 100: //d
        keyd = true;
        break;
    case 80: //P
    case 112: //p
        keyp = true;
        break
    case 87:  //W
    case 119:  //w
        keyw = true;
        break;
    case 76: //L
    case 108: //l
        keyl = true;
        break;
    case 83: //S
    case 115: //s
        keys = true;
        break;
    case 82: //R
    case 114: //r
        keyr= true;
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
    time/=1000;

    //Not Paused
    if(next_cam == 1){
        //Key p pressed
        if(keyp){
            pointLight.visible = !pointLight.visible;
            keyp = false;
        }
        //Key d pressed
        if(keyd){
            dirLight.visible = !dirLight.visible;
            keyd = false;
        }
        //Key l pressed
        if(keyl){
            if(!wire){
                board.changeMat(next_material);
                ball.changeMat(next_material);
                dice.changeMat(next_material);
                next_material = next_material == 0 ? 1 : 0;
            }
            keyl = false;
        }
    
        
        //Key w pressed
        if(keyw){
            wire = !wire;
            if(wire){
                ball.changeMat(2);
                dice.changeMat(2);
                board.changeMat(2);
            }
            else{
                ball.changeMat((next_material - 1) * -1);
                dice.changeMat((next_material - 1) * -1);
                board.changeMat((next_material - 1) * -1);
            }
            keyw = false;
        }
        //Key b is pressed
        if(keyb){
            keyb = false;
            ball.acc *= -1;
        }
    }
    //Paused
    else{

        if(keyr){
            ball.reset();
            dice.reset();
            board.reset();
            dirLight.visible = true;
            pointLight.visible = true;
            next_material = 1;
        }

        keyl = false;
        keyp = false;
        keyw = false;
        keyb = false;
        keyd = false;
    }
    keyr = false;
    //Key s pressed
    if(keys){
        //Pause
        if(next_cam == 1){
            dice.pause();
            ball.pause();
            current_cam = cam1;
        }
        //Resume
        else{
            dice.resume();
            ball.resume();
            current_cam = cam2;
        }
        next_cam = next_cam == 0 ? 1 : 0;
        onResize();
        
        keys = false;
    }

    dice.rotate(time);
    ball.rotateAroundItself(time);

    time = delta;
    render();

    requestAnimationFrame(animate);
}