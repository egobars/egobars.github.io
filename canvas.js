let canvas, ctx;
let a_canvas, a_ctx;

window.onload = function() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    a_canvas = canvas.cloneNode(true);
    a_ctx = a_canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    a_canvas.width = 5000;
    a_canvas.height = 5000;

    ctx.scale(dpr, dpr);

    // canvas.style.width = `${rect.width}px`;
    // canvas.style.height = `${rect.height}px`;

    let prev_mouse_x = null;
    let prev_mouse_y = null;
    let delta_mouse_x = 0;
    let delta_mouse_y = 0;

    let is_wheel_down = false;
    let is_mouse_down = false;
    let was_here_mouse_down = false;

    let squares = [];

    let scale = 1;
    let scale_multiplier = 1.1;

    let x_offset = 0;
    let y_offset = 0;

    canvas.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            is_mouse_down = true;
        } else if (event.button === 1) {
            is_wheel_down = true;
        } else if (event.button === 2) {
            is_wheel_down = true;
        }
    });

    document.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
            is_mouse_down = false;
            was_here_mouse_down = false;
        } else if (event.button === 1) {
            is_wheel_down = false;
        } else if (event.button === 2) {
            is_wheel_down = false;
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (prev_mouse_x === null) {
            delta_mouse_x = 0;
        } else {
            delta_mouse_x = event.x - prev_mouse_x;
        }
        if (prev_mouse_y === null) {
            delta_mouse_y = 0;
        } else {
            delta_mouse_y = event.y - prev_mouse_y;
        }

        if (is_mouse_down) {
            const rect = canvas.getBoundingClientRect();
            ctx.fillStyle = "rgb(200, 0, 0)";
            a_ctx.fillStyle = "rgb(200, 0, 0)";

            if (was_here_mouse_down) {
                if (Math.abs(delta_mouse_x) / scale > 15 || Math.abs(delta_mouse_y) / scale > 15) {
                    let scaled_delta_x = Math.abs(delta_mouse_x) / scale;
                    let scaled_delta_y = Math.abs(delta_mouse_y) / scale;
                    let squares_to_add_number = Math.max(scaled_delta_x / 10, scaled_delta_y / 10);
                    let to_add_x = delta_mouse_x / squares_to_add_number;
                    let to_add_y = delta_mouse_y / squares_to_add_number;
                    let x = prev_mouse_x - rect.left;
                    let y = prev_mouse_y - rect.top;
                    for (let i = 0; i < squares_to_add_number; ++i) {
                        if (-x_offset + x / scale - 10 < 0 || -x_offset + x / scale - 10 > 5000) {
                            continue;
                        }
                        if (-y_offset + y / scale - 10 < 0 || -y_offset + y / scale - 10 > 5000) {
                            continue;
                        }
                        ctx.fillRect(x / scale - 10, y / scale - 10, 20, 20);
                        squares.push({'x': x / scale - 10, 'y': y / scale - 10, 'size': 20});
                        a_ctx.fillRect(-x_offset + x / scale - 10, -y_offset + y / scale - 10, 20, 20);
                        x += to_add_x;
                        y += to_add_y;
                    }
                }
            }
            if (-x_offset + (event.x - 10 * scale - rect.left) / scale >= 0 && -x_offset + (event.x - 10 * scale - rect.left) / scale <= 5000) {
                if (-y_offset + (event.y - 10 * scale - rect.top) / scale >= 0 && -y_offset + (event.y - 10 * scale - rect.top) / scale <= 5000) {
                    ctx.fillRect((event.x - 10 * scale - rect.left) / scale, (event.y - 10 * scale - rect.top) / scale, 20, 20);
                    a_ctx.fillRect(-x_offset + (event.x - 10 * scale - rect.left) / scale, -y_offset + (event.y - 10 * scale - rect.top) / scale, 20, 20);
                    squares.push({'x': (event.x - 10 * scale - rect.left) / scale, 'y': (event.y - 10 * scale - rect.top) / scale, 'size': 20});
                }
            }
        }

        if (is_wheel_down) {
            ctx.save();
            /*let delta_x = delta_mouse_x / scale;
            let delta_y = delta_mouse_y / scale;
            for (let i = 0; i < squares.length; ++i) {
                squares[i].x += delta_x;
                squares[i].y += delta_y;
                ctx.fillRect(squares[i].x, squares[i].y, squares[i].size, squares[i].size);
            }*/
            ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
            x_offset += delta_mouse_x / scale;
            y_offset += delta_mouse_y / scale;
            a_ctx.save();
            a_ctx.scale(scale, scale);
            ctx.drawImage(a_canvas, x_offset, y_offset);
            a_ctx.restore();

            if (x_offset > 0) {
                ctx.fillStyle = "rgb(211, 211, 211)";
                ctx.fillRect(0, 0, x_offset, canvas.height / scale);
            }
            if (y_offset > 0) {
                ctx.fillStyle = "rgb(211, 211, 211)";
                ctx.fillRect(0, 0, canvas.width / scale, y_offset);
            }
            if ((x_offset + 5000) * scale < canvas.width) {
                console.log('a');
                ctx.fillStyle = "rgb(211, 211, 211)";
                ctx.fillRect((x_offset * scale + 5000) / scale, 0, canvas.width - (x_offset * scale + 5000) / scale, canvas.height / scale);
            }

            ctx.restore();
        }

        prev_mouse_x = event.x;
        prev_mouse_y = event.y;

        was_here_mouse_down = true;
    });

    window.addEventListener("wheel", event => {
        const delta = Math.sign(event.deltaY);
        if (delta < 0) {
            ctx.clearRect(0, 0,  canvas.width / scale,  canvas.height / scale);
            scale *= scale_multiplier;
            ctx.scale(scale_multiplier, scale_multiplier);
            /*for (let i = 0; i < squares.length; ++i) {
                squares[i].x -= Math.floor(canvas.width / 20 / scale);
                squares[i].y -= Math.floor(canvas.height / 20 / scale);
                ctx.fillRect(squares[i].x, squares[i].y, squares[i].size, squares[i].size);
            }*/
            x_offset -= canvas.width / 20 / scale;
            y_offset -= canvas.height / 20 / scale;
        } else if (delta > 0) {
            ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
            scale /= scale_multiplier;
            ctx.scale(1 / scale_multiplier, 1 / scale_multiplier);
            /*for (let i = 0; i < squares.length; ++i) {
                squares[i].x += Math.floor(canvas.width / 22 / scale);
                squares[i].y += Math.floor(canvas.height / 22 / scale);
                ctx.fillRect(squares[i].x, squares[i].y, squares[i].size, squares[i].size);
            }*/
            x_offset += canvas.width / 22 / scale;
            y_offset += canvas.height / 22 / scale;
        }
        ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
        a_ctx.save();
        a_ctx.scale(scale, scale);
        ctx.drawImage(a_canvas, x_offset, y_offset);
        a_ctx.restore();

        if (x_offset > 0) {
            ctx.fillStyle = "rgb(211, 211, 211)";
            ctx.fillRect(0, 0, x_offset, canvas.height / scale);
        }
        if (y_offset > 0) {
            ctx.fillStyle = "rgb(211, 211, 211)";
            ctx.fillRect(0, 0, canvas.width / scale, y_offset);
        }

        ctx.restore();
    });
}
