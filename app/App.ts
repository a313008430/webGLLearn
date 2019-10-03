import Core from "./core/Core";
import Logic from "./logic/Logic";

class App {
    constructor() {
        Core.canvas = document.querySelector('canvas')!;
        let gl = Core.canvas.getContext("webgl2");
        if (!gl) {
            return;
        }
        Core.gl = gl;

        new Logic();
    }


}
new App();