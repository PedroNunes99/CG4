"use strict";	//Aplies to all of script

/*
 Group 28

 81609 Joel Almeida
 81824 Nuno Amaro
 81853 Tiago Goncalves
*/

/*Global Variables*/
var scene, renderer;

//Camera
var camera = new Array(3);
var active_camera = 0;

//Light
var dirlight;
var pointlight = new Array(6);

//Objects
var spaceship;
var objectsgroup = new THREE.Group();

//Clock
var clock = new THREE.Clock();

//Wall Array
var walls = [];

//Wireframe Control Variable
var wires = true;

//Material
var alienmat;
var spaceshipmat;

//Size and aspectratio
var width = 150, height = 70;
var aspectratio;
var ratio = 2.07;
var scale = 0.013;
var scale_width;
var scale_height;
var last_width;
var last_height;

//Bullet Control Variable
var new_bullet_allowed = true;

/*Base Class*/
class Entity extends THREE.Object3D{
	constructor() {
		super();
		this.velocity = new THREE.Vector3();
		this.aceleration = new THREE.Vector3();
		this.maxvel = new THREE.Vector3();
		this.minvel = new THREE.Vector3();
		this.width = 0;
		this.height = 0;
		this.radius = 0;
	}

	myType() { return "entity"; }

	updatepos(delta) {
		var oldvel = new THREE.Vector3().copy(this.velocity);
		var oldpos = new THREE.Vector3().copy(this.position);

		// v = a * delta; limits velocity within a maximum and minimum value
		var nvel = (oldvel.addScaledVector(this.aceleration, delta)).clamp(this.minvel, this.maxvel);
		// x = x0 + v
		var npos = oldpos.add(nvel);

		/*Checks if object will hit a Wall/Limit before it happens and acts accordingly*/
		if (npos.x - this.width/2 < -width/2) {
			this.collideWallLR(npos, nvel, -1); // left wall (negative)
		}
		else if (npos.x + this.width/2 > width/2) {
			this.collideWallLR(npos, nvel, 1); // right wall (positive)
		}
		else if (npos.y + this.height/2 > height/2) {
			this.collideWallTB(npos, nvel, 1); // top wall (positive)
		}
		else if (npos.y - this.height/2 < -height/2) {
			this.collideWallTB(npos, nvel, -1); // bottom wall (negative)
		}

		//proceeds movement after checking for potential wall hits
		this.velocity.copy(nvel);
		this.position.copy(npos);
	}

	checkCollisions(ob) {
		var ourPos = this.position;
		var objPos = ob.position;
		var dist = ourPos.distanceTo(objPos);
		//Considering a sphere around each object if sum of radiuses is less than distance between both centers, a collision is detected
		if(dist <= this.radius + ob.radius) {
			//Collision treatment is handled by the object
			this.treatCollision(ob);
		}
	}

	//To be defined by each object for independent treatment
	collideWallLR(npos, nvel, side) {}
	collideWallTB(npos, nvel, side) {}
	treatCollision(ob){}

	//Changes Active Material
	changeMaterial(mat) {
		this.children[0].material = mat;
	}

	//Switches Between Different Materials for Phong and Gouraud Shading [G]
	changeLightMaterial(materials) {
		var oldmat = this.lightmaterial;
		if (this.lightmaterial == materials[1]) {
			this.lightmaterial = materials[2]; //Phong
		}
		else {
			this.lightmaterial = materials[1]; //Lambert (Gouraud Shadian)
		}

		if (this.children[0].material == oldmat) {
			this.changeMaterial(this.lightmaterial);
		}
	}

	//Switches Between Shading Materials and Basic Material [L]
	onOffLightCalc(materials) {
		if (this.children[0].material == this.lightmaterial) {
			this.changeMaterial(materials[0]); //Basic
		}
		else {
			this.changeMaterial(this.lightmaterial);
		}
	}
}

class Spaceship extends Entity {
	constructor(x, y, z) {
		super();
		this.maxvel.set(1, 0, 0);
		this.minvel.set(-1, 0, 0);
		this.width = 7;
		this.height = 5;
		createSpaceship(this, x, y, z);
		this.lightmaterial = spaceshipmat[1]; //Lambert
	}

	myType() { return "spaceship"; }

	//Spaceship moves horizontally
	moveDir(min, max, ac) {
		this.minvel.setX(min);
		this.maxvel.setX(max);
		this.aceleration.setX(ac);
	}

	collideWallLR(npos, nvel, side) { // side = -1 -> left / side = 1 -> right
		npos.setX( (width/2 - this.width/2) * side);
		nvel.set(0, 0 ,0);
		this.aceleration.set(0, 0, 0);
		return npos, nvel;
	}

	treatCollision(ob){
		//TODO
	}

	fireBullet() {
		new Bullet(this.children[0].material); //arg defines bullet start material
	}

	changeLightCalc() {
		this.changeLightMaterial(spaceshipmat);
	}

	changeCalc() {
		this.onOffLightCalc(spaceshipmat);
	}

}

class Bullet extends Entity {
	constructor(initmat) { //bullet's material
		super();
		this.width = 0.5;
		this.height = 0.5;
		//moves vertically
		this.velocity.set(0, 1,	 0);
		this.maxvel.set(0, 1, 0);
		this.minvel.set(0, -1, 0);
		//due to size we can use half it's width/height for collision testing
		this.radius = 0.25;
		this.lightmaterial = spaceshipmat[1]; //Lambert

		var bulletMaterial = initmat;
		var geometry = new THREE.CubeGeometry(0.5, 0.5, 0.5);
		geometry.computeFaceNormals();
		var mesh = new THREE.Mesh(geometry, bulletMaterial);
		this.position.set(spaceship.position.x, spaceship.position.y + spaceship.height/2 + this.height, spaceship.position.z);

		this.add(mesh);
		objectsgroup.add(this);
	}

	myType() { return "bullet"; }

	collideWallTB(npos, nvel, side) { //if the collision was from a bullet, removes it
		objectsgroup.remove(this);
		this.delete;
	}

	changeLightCalc() {
		this.changeLightMaterial(spaceshipmat);
	}

	changeCalc() {
		this.onOffLightCalc(spaceshipmat);
	}
}

class Alien extends Entity {
	constructor(x, y, z) {
		super();
		this.velocity.set( (2 * Math.random() ) - 1 , (2 * Math.random() ) - 1 , 0).normalize().multiplyScalar(0.5);
		this.maxvel.set(1, 1, 0);
		this.minvel.set(-1, -1, 0);
		this.width = 7;
		this.height = 6;
		this.radius = 4;	//based on the approximation of the hypothenuse between it's height and width. Simulates a circle around it.
		createAlien(this, x, y, z);
		this.lightmaterial = alienmat[1]; //Lambert
	}

	myType() { return "alien"; }

	collideWallLR(npos, nvel, side) { // side = -1 -> left / side = 1 -> right
		npos.setX( (width/2 - this.width/2) * side);
		nvel.setX(nvel.x * -1);
		return npos, nvel;
	}

	collideWallTB(npos, nvel, side) { // side = -1 -> bottom / side = 1 -> top
		npos.setY( (height/2 - this.height/2) * side);
		nvel.setY(nvel.y * -1);
		return npos, nvel;
	}

	treatCollision(obj){
		//Alien-Alien collision should make them go the opposite direction
		if(obj.myType() == "alien"){
			this.velocity.multiplyScalar(-1);
			obj.velocity.multiplyScalar(-1);
		}
		//Alien-Bullet collision should make both Bullet and Alien dissapear
		if(obj.myType() == "bullet"){
			objectsgroup.remove(obj);
			objectsgroup.remove(this);
		}
	}

	changeLightCalc() {
		this.changeLightMaterial(alienmat);
	}

	changeCalc() {
		this.onOffLightCalc(alienmat);
	}

}

/*Iterates through objectsgroup in search for collisions*/
function handleCollisions() {
	for(var i = 0; i < objectsgroup.children.length - 1; i++){
		//j = i + 1 -> important to avoid unecessary checks
		for(var j = i + 1; j < objectsgroup.children.length; j++){
			objectsgroup.children[i].checkCollisions(objectsgroup.children[j]);
		}
	}
}

/*Base element for construction of characters*/
function addBox(full, material, x, y, z, xB, yB, zB) {

	var geometry = new THREE.CubeGeometry(xB, yB, zB);
	var mesh = new THREE.Mesh(geometry, material);
	mesh.position.set(x, y, z);

	full.push(mesh);
}

/*Base element for construction of walls*/
function addWall(x, y, z, xB, yB, zB) {

	var mat = new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: false});
	var geometry = new THREE.CubeGeometry(xB, yB, zB);
	var mesh = new THREE.Mesh(geometry, mat);
	mesh.position.set(x, y, z);

	scene.add(mesh);

	return mesh;
}

function mergeMeshes (meshes) {
	var merged = new THREE.Geometry();

	for (var mesh of meshes) {
		mesh.updateMatrix();
		merged.merge(mesh.geometry, mesh.matrix);
	}

	return merged;
}

function toggleWireframe() {
	wires = !wires;

	for (var mat of alienmat) {
		mat.wireframe = wires;
	}

	for (var mat of spaceshipmat) {
		mat.wireframe = wires;
	}
}

/* Creates a face for a given geometry*/
function createFace(faces, v0, v1, v2, v3, side) {
	if (side) {
		faces.push(
			new THREE.Face3(v0, v2, v1),
			new THREE.Face3(v1, v2, v3)
		);
	}

	else {
		faces.push(
			new THREE.Face3(v0, v1, v2),
			new THREE.Face3(v1, v3, v2)
		);
	}
}

/* Creates a vertex group for a given shape*/
function createVertexGroup(vertex, x0, x1, y0, y1, z0, z1) {
	vertex.push(
		new THREE.Vector3(x0, y1, z0),  // v0  v1
		new THREE.Vector3(x1, y1, z0),	// v2  v3
		new THREE.Vector3(x0, y0, z0),
		new THREE.Vector3(x1, y0, z0),

		new THREE.Vector3(x0, y1, z1), 	// v4  v5
		new THREE.Vector3(x1, y1, z1),	// v6  v7
		new THREE.Vector3(x0, y0, z1),
		new THREE.Vector3(x1, y0, z1)
	);
}

function customSpaceship() {
	var geo = new THREE.Geometry();

	var vertex = [];

	/* Comparar valores antigos
	addBox(meshes, spaceshipMaterial, 0, 0, 0, 7, 2, 3);
	addBox(meshes, spaceshipMaterial, 0, 1.5, 0, 5, 1, 3);
	addBox(meshes, spaceshipMaterial, 0, 2.5, 0, 1, 1, 3);
	addBox(meshes, spaceshipMaterial, 0, 3.5, 0, 0.5, 1, 3);*/

	createVertexGroup(vertex, -3.5, 3.5, 0, 2, 0, 1.5);
	createVertexGroup(vertex, -2.5, 2.5, 2, 3, 0, 1.5);
	createVertexGroup(vertex, -1, 1, 3, 4, 0, 1.5);
	createVertexGroup(vertex, -0.25, 0.25, 4, 5, 0, 1.5);

	var faces = [];

	// Biggest Part
	createFace(faces, 0, 1, 2, 3, 0); 	//Bottom
	createFace(faces, 4, 5, 6, 7, 1); 	//Top
	createFace(faces, 0, 2, 4, 6, 0); 	//Left
	createFace(faces, 1, 3, 5, 7, 1);	//Right
	createFace(faces, 6, 7, 2, 3, 1);	//Front
	createFace(faces, 4, 14, 0, 10, 0);	//Back-Left
	createFace(faces, 15, 5, 11, 1, 0);	//Back-Right

	// Medium Part
	createFace(faces, 8, 9, 10, 11, 0);	//Bottom
	createFace(faces, 12, 13, 14, 15, 1);	//Top
	createFace(faces, 8, 10, 12, 14, 0); 	//Left
	createFace(faces, 9, 11, 13, 15, 1);	//Right
	createFace(faces, 12, 22, 8, 18, 0);	//Back-Left
	createFace(faces, 23, 13, 19, 9, 0);	//Back-Right

	// Small Part
	createFace(faces, 16, 17, 18, 19, 0); //Bottom
	createFace(faces, 20, 21, 22, 23, 1); //Top
	createFace(faces, 16, 18, 20, 22, 0); //Left
	createFace(faces, 17, 19, 21, 23, 1); //Right
	createFace(faces, 20, 30, 16, 26, 0); //Back-Left
	createFace(faces, 31, 21, 27, 17, 0); //Back-Right

	// Pointy Part
	createFace(faces, 24, 25, 26, 27, 0); //Bottom
	createFace(faces, 28, 29, 30, 31, 1); //Top
	createFace(faces, 24, 26, 28, 30, 0); //Left
	createFace(faces, 25, 27, 29, 31, 1); //Right
	createFace(faces, 28, 29, 24, 25, 0); //Back

	geo.vertices = vertex;
	geo.faces = faces;
	geo.computeFaceNormals();

	return geo;
}

/*Creation of Aliens*/
function createAlien(alien, x, y, z) {

	var meshes = [];

	var alienMaterial = alienmat[0];

	addBox(meshes, alienMaterial, 0, 0, 0, 1, 4, 3);

	addBox(meshes, alienMaterial, 0, 2.5, 0, 3, 1, 3);

	addBox(meshes, alienMaterial, 1.5, -0.5, 0, 2, 1, 3);
	addBox(meshes, alienMaterial, -1.5, -0.5, 0, 2, 1, 3);

	addBox(meshes, alienMaterial, 2, -2, 0, 1, 2, 3);
	addBox(meshes, alienMaterial, -2, -2, 0, 1, 2, 3);

	addBox(meshes, alienMaterial, 2.5, 0.5, 0, 2, 1, 3);
	addBox(meshes, alienMaterial, -2.5, 0.5, 0, 2, 1, 3);

	addBox(meshes, alienMaterial, 1.5, 1.5, 0, 2, 1, 3);
	addBox(meshes, alienMaterial, -1.5, 1.5, 0, 2, 1, 3);

	var geo = mergeMeshes(meshes);
	geo.computeFaceNormals();

	var mesh = new THREE.Mesh(geo, alienMaterial);

	alien.add(mesh);

	alien.position.x = x;
	alien.position.y = y;
	alien.position.z = z;

	objectsgroup.add(alien);
}

//Helper function to create an entire row of aliens
function createRow(y) {

	new Alien(15, y, 0);
	new Alien(-15, y, 0);
	new Alien(45, y, 0);
	new Alien(-45, y, 0);
}

/*Creation of Spaceship*/
function createSpaceship(spaceship, x, y, z) {

	var meshes = [];

	var spaceshipMaterial = spaceshipmat[0];

	/*addBox(meshes, spaceshipMaterial, 0, 0, 0, 7, 2, 3);
	addBox(meshes, spaceshipMaterial, 0, 1.5, 0, 5, 1, 3);
	addBox(meshes, spaceshipMaterial, 0, 2.5, 0, 1, 1, 3);
	addBox(meshes, spaceshipMaterial, 0, 3.5, 0, 0.5, 1, 3);*/

	var geo = customSpaceship();
	/*var geo = mergeMeshes(meshes);*/
	geo.computeFaceNormals();
	var mesh = new THREE.Mesh(geo, spaceshipMaterial);
	spaceship.add(mesh);

	spaceship.position.x = x;
	spaceship.position.y = y;
	spaceship.position.z = z;

	objectsgroup.add(spaceship);
}

/*Physical Limits of Game*/
function createWalls() {
	addWall(-width/2 - 0.5, 0, 0, 1, height, 3); // left
	addWall(0, height/2 + 0.5, 0, width, 1, 3); // top
	addWall(width/2 + 0.5, 0, 0, 1, height, 3); // right
	addWall(0, -height/2 -0.5, 0, width, 1, 3); // bottom
}

/*Creation of Orthographical Camera*/
function createOrtCamera() {

	//Game area should have 150 units horizontally and 70 units vertically
	if (window.innerWidth / window.innerHeight > ratio)
		camera[0] = new THREE.OrthographicCamera(-window.innerWidth / scale_height, window.innerWidth / scale_height, -window.innerHeight / scale_height, window.innerHeight / scale_height, 1, 100);
	else
		camera[0] = new THREE.OrthographicCamera(-window.innerWidth / scale_width, window.innerWidth / scale_width, -window.innerHeight / scale_width, window.innerHeight / scale_width, 1, 100);

	last_width = window.innerWidth;
	last_height = window.innerHeight;

	//Positioning and Rotation
	camera[0].position.z = -50;
	camera[0].lookAt(scene.position);
	camera[0].rotation.z = 0;
}

function createFixedPerspCamera() {
	camera[1] = new THREE.PerspectiveCamera(100, window.innerWidth / window.innerHeight, 1, 100);

	camera[1].position.set(0, -30, 45);
	camera[1].lookAt( new THREE.Vector3(0, -10, 0) );
}

function createBehindPerspCamera() {
	camera[2] = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 1, 100);

	//Positioning and Rotation
	spaceship.add(camera[2]);
	camera[2].position.set(0, -10, 10);
	camera[2].lookAt( new THREE.Vector3(0, 0, 0) );
}

/*Main function for window resize*/
function onResize() {
	renderer.setSize(window.innerWidth, window.innerHeight);

	scale_width = (window.innerWidth * scale_width) / last_width;
	scale_height = (window.innerHeight * scale_height) / last_height;

	last_width = window.innerWidth;
	last_height = window.innerHeight;

	//OrthographicCamera
	if (window.innerWidth / window.innerHeight > ratio)
		resizeOrtCamera(scale_height);
	else
		resizeOrtCamera(scale_width);

	//PerspectiveCameras
	resizeBehindPerspCamera();
	resizeFixedPerspCamera();
}

/*OrthographicCamera resize function*/
function resizeOrtCamera(scale) {
	camera[0].left = -window.innerWidth / scale;
	camera[0].right = window.innerWidth / scale;
	camera[0].top = -window.innerHeight / scale;
	camera[0].bottom = window.innerHeight / scale;
	camera[0].updateProjectionMatrix();
}

function resizeBehindPerspCamera() {
	resizePerspCamera(2);
}

function resizeFixedPerspCamera() {
	resizePerspCamera(1);
}

/*PerspectiveCamera resize function*/
function resizePerspCamera(number) {
	camera[number].aspect = window.innerWidth / window.innerHeight;
	camera[number].updateProjectionMatrix();
}

/*Switch Active Camera*/
function switch_camera(number) {
	active_camera = number;
}

/*Defining the DirectionalLight*/
function createDirLight() {
	dirlight = new THREE.DirectionalLight(0xffffff, 0.7);
	dirlight.position.set(-20, -20, 50);
	dirlight.target.position.set( width/2, height/2, 0 );
	dirlight.target.updateMatrixWorld();
	scene.add(dirlight);
}

/*Defining a PointLight*/
function createPointLight(x, y, z, color) {
	//we can change individual color of light
	var point = new THREE.PointLight(color, 3, 20);

	point.position.set(x, y, z);
	point.castShadow = true;
	scene.add(point);

	return point;
}

/*Creation of Pointlights (stars)*/
function createCircuit() {
	pointlight[0] = createPointLight(-40, 17, 10, 0xffffff);
	pointlight[1] = createPointLight(0, 17, 10, 0xffffff);
	pointlight[2] = createPointLight(40, 17, 10, 0xffffff);
	pointlight[3] = createPointLight(-40, -17, 10, 0xffffff);
	pointlight[4] = createPointLight(0, -17, 10, 0xffffff);
	pointlight[5] = createPointLight(40, -17, 10, 0xffffff);
}

/*Toggle DirectionalLight (sun) [N]*/
function onOffDirLight() {
	dirlight.visible = !dirlight.visible;
}

/*Toggle Pointlights [C]*/
function onOffCircuit() {
	//inverts current state
	var state = !pointlight[0].visible;
	//sets new state for all pointlights
	for (var light of pointlight) {
		light.visible = state;
	}
}

/**Toggle Light Calculations*/
function onOffLight() {
	for (var obj of objectsgroup.children) {
		obj.changeCalc();
	}
}

/*Toggle Shading*/
function changeShading() {
	for (var obj of objectsgroup.children) {
		obj.changeLightCalc();
	}
}

/*Creation of Scene*/
function createScene() {
	scene = new THREE.Scene();

	// Game Materials
	createMaterials();

	//Game Elements
	createWalls();
	spaceship = new Spaceship(0, -30, 0);
	createRow(25);
	createRow(10);
	scene.add(objectsgroup);
}

/*Creation of Arrays Containing the Different Materials*/
function createMaterials() {
	alienmat = new Array(3);
	alienmat[0] = new THREE.MeshBasicMaterial( {color: 0xffffff, wireframe: wires });
	alienmat[1] = new THREE.MeshLambertMaterial( {color: 0xffffff, wireframe: wires });
	alienmat[2] = new THREE.MeshPhongMaterial( {color: 0xffffff, wireframe: wires , shininess: 100});

	spaceshipmat = new Array(3);
	spaceshipmat[0] = new THREE.MeshBasicMaterial( {color: 0x00ff00, wireframe: wires });
	spaceshipmat[1] = new THREE.MeshLambertMaterial( {color: 0x00ff00, wireframe: wires });
	spaceshipmat[2] = new THREE.MeshPhongMaterial( {color: 0x00ff00, wireframe: wires , shininess: 100});
}

function createCameras() {
	createOrtCamera();
	createBehindPerspCamera();
	createFixedPerspCamera();
}

function createLights() {
	createDirLight();
	createCircuit();
}

/*Keyboard Instructions*/
function onKeyDown(e) {

	switch (e.keyCode) {
		//Cameras
		case 49: //1
			switch_camera(0);
			break;
		case 50: //2
			switch_camera(1);
			break;
		case 51: //3
			switch_camera(2);
			break;

		//Wireframe Toggle
		case 65: //A
		case 97: //a
			toggleWireframe();
			break;

		//Lights
		case 67: //C
		case 99: //c
			onOffCircuit();
			break;
		case 71: //G
		case 103: //g
			changeShading();
			break;
		case 76: //L
		case 108: //l
			onOffLight();
			break;
		case 78: //N
		case 110: //n
			onOffDirLight();
			break;

		//Movement Toggle
		case 37: //LEFT
			spaceship.moveDir(-1, 1, -1);
			break;
		case 39: //RIGHT
			spaceship.moveDir(-1, 1, 1);
			break;

		//Bullets
		case 66: //B
		case 98: //b
			if (new_bullet_allowed) {
				spaceship.fireBullet();
				new_bullet_allowed = false;
			}
			break;
	}
}

function onKeyUp(e) {
	switch (e.keyCode){
		case 37:
			spaceship.moveDir(-1, 0, 1);
			break;
		case 39:
			spaceship.moveDir(0, 1, -1);
			break;
		case 66: //B
		case 98: //b
			new_bullet_allowed = true;
			break;
	}
}

function checkMove() {
	var delta = clock.getDelta();

	spaceship.updatepos(delta);	//spaceship movement

	for (var obj of objectsgroup.children) {
		obj.updatepos(delta);
	}

	//Checks for collisions of certain objects
	handleCollisions();
}

function render() {
	renderer.render(scene, camera[active_camera]);
}

/*Main Functions*/
function animate() {
	//Checks for keyboard input for movement
	checkMove();
	//Renders Scene
	render();

	requestAnimationFrame(animate);
}

function init() {
	//Defines renderer
	renderer = new THREE.WebGLRenderer( {antialias: true } );
	renderer.setSize(window.innerWidth, window.innerHeight);

	scale_width = window.innerWidth * scale;
	scale_height = window.innerHeight * scale * ratio;

	document.body.appendChild(renderer.domElement);

	//Adds Scene and Cameras
	createScene();
	createCameras();
	createLights();

	//Event Listeners
	window.addEventListener("resize", onResize);
	window.addEventListener("keydown", onKeyDown);
	window.addEventListener("keyup", onKeyUp);
}
