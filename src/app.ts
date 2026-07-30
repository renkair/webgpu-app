import {Renderer} from "./renderer.ts";
import $ from "jquery"

export class App {
    canvas: HTMLCanvasElement;
    renderer: Renderer;

    keyLabel: HTMLElement;
    mouseXLabel: HTMLElement;
    mouseYLabel: HTMLElement;

    forwards_amount: number;
    right_amount: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new Renderer(canvas);

        this.forwards_amount = 0;
        this.right_amount = 0;

        this.keyLabel = document.getElementById("key-label");
        $(document).on("keydown", (event) => {this.handle_keypress(event);});
        $(document).on("keyup", (event) => {this.handle_keyrelease(event);});

        this.mouseXLabel = document.getElementById("mouse-x-label");
        this.mouseYLabel = document.getElementById("mouse-y-label");
        this.canvas.onclick = () => {
            this.canvas.requestPointerLock();
        }
        this.canvas.addEventListener("mousemove", (event) => {this.handle_mouse_move(event);});

    }

    async initialize()
    {
        await this.renderer.Initialize();
    }

    run = () =>{
        var running: boolean = true;


        this.renderer.render();

        this.renderer.moveCamera(this.forwards_amount, this.right_amount);

        if(running)
        {
            requestAnimationFrame(this.run);
        }
    }

    handle_keypress(event: JQuery.KeyDownEvent) {
        this.keyLabel.innerText = event.code;

        if(event.code == "KeyW")
        {
            this.forwards_amount = 0.05;
        }
        if(event.code == "KeyS")
        {
            this.forwards_amount = -0.05;
        }
        if(event.code == "KeyA")
        {
            this.right_amount = -0.05;
        }
        if(event.code == "KeyD")
        {
            this.right_amount = 0.05;
        }
    }

    handle_keyrelease(event: JQuery.KeyUpEvent) {
        this.keyLabel.innerText = event.code;

        if(event.code == "KeyW")
        {
            this.forwards_amount = 0;
        }
        if(event.code == "KeyS")
        {
            this.forwards_amount = 0;
        }
        if(event.code == "KeyA")
        {
            this.right_amount = 0;
        }
        if(event.code == "KeyD")
        {
            this.right_amount = 0;
        }

    }

    handle_mouse_move(event: MouseEvent) {
        this.mouseXLabel.innerText = event.clientX.toString();
        this.mouseYLabel.innerText = event.clientY.toString();

        // this.scene.spin_player(
        //     event.movementX / 5, -event.movementY / 5
        // );

        this.renderer.spinCamera(/*pitch*/-event.movementY / 10, /*yaw*/-event.movementX / 10);
    }
}