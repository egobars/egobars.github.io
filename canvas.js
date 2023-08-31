let canvas, ctx;
let a_canvas, a_ctx;
let undo_canvas, undo_ctx;

let canvas_height = 5000;
let canvas_width = 5000;

function is_mouse_on_canvas(x, y) {
    if (x < 0 || x > canvas_width - 1) {
        return false;
    }
    if (y < 0 || y > canvas_height - 1) {
        return false;
    }
    return true;
}

window.onload = function() {
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    a_canvas = canvas.cloneNode(true);
    a_ctx = a_canvas.getContext("2d", { willReadFrequently: true });

    undo_canvas = a_canvas.cloneNode(true);
    undo_ctx = undo_canvas.getContext("2d");

    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    a_canvas.width = canvas_width;
    a_canvas.height = canvas_height;
    undo_canvas.width = canvas_width;
    undo_canvas.height = canvas_height;

    ctx.scale(dpr, dpr);

    let prev_mouse_x = null;
    let prev_mouse_y = null;
    let delta_mouse_x = 0;
    let delta_mouse_y = 0;

    let is_wheel_down = false;
    let is_mouse_down = false;
    let was_here_mouse_down = false;

    let scale = 1;
    let scale_multiplier = 1.1;

    let x_offset = 0;
    let y_offset = 0;

    let width = 10;

    let color_obj = document.getElementById("color");
    let color = color_obj.value;
    let prev_color;

    let is_mouse_down_slider = false;
    let slider_obj = document.getElementById("slider");
    let stripe_obj = document.getElementById("stripe");

    let transparency = 1;
    let prev_transparency;
    let is_mouse_down_slider_t = false;
    let slider_t_obj = document.getElementById("slider-transparency");
    let stripe_t_obj = document.getElementById("stripe-transparency");

    let current_tool = 0;
    let brush_obj = document.getElementById("brush");
    let eraser_obj = document.getElementById("eraser");
    let bucket_obj = document.getElementById("bucket");
    let undo_obj = document.getElementById("undo");

    let size_width_obj = document.getElementById("size-width");
    let size_height_obj = document.getElementById("size-height");
    let size_submit_obj = document.getElementById("size-submit");

    let template_obj = document.getElementById("template");

    let download_obj = document.getElementById("download");

    function draw_footprint() {
        a_ctx.save();
        a_ctx.scale(scale, scale);
        ctx.drawImage(a_canvas, x_offset, y_offset);
        a_ctx.restore();
    }

    function draw_square(x, y) {
        ctx.globalAlpha = transparency;
        ctx.fillStyle = color;
        a_ctx.globalAlpha = transparency;
        a_ctx.fillStyle = color;

        const rect = canvas.getBoundingClientRect();
        let real_x = -x_offset + (x - rect.left) / scale;
        let real_y = -y_offset + (y - rect.top) / scale;
        if (!is_mouse_on_canvas(real_x, real_y)) {
            return;
        }

        real_x = Math.floor(real_x);
        real_y = Math.floor(real_y);

        ctx.fillRect(real_x + x_offset - width, real_y + y_offset - width, width * 2, width * 2);
        a_ctx.fillRect(real_x - width, real_y - width, width * 2, width * 2);
    }

    function paint_pixel(data, x, y, r, g, b, a) {
        data[4 * (y * canvas_width + x)] = r;
        data[4 * (y * canvas_width + x) + 1] = g;
        data[4 * (y * canvas_width + x) + 2] = b;
        data[4 * (y * canvas_width + x) + 3] = a;
    }

    function check_pixel(x, y, r, g, b, a, data) {
        if (!is_mouse_on_canvas(x, y)) {
            return false;
        }
        if (x === 5000) {
            console.log('a');
        }
        if (data[4 * (y * canvas_width + x)] !== r) {
            return false;
        }
        if (data[4 * (y * canvas_width + x) + 1] !== g) {
            return false;
        }
        if (data[4 * (y * canvas_width + x) + 2] !== b) {
            return false;
        }
        if (data[4 * (y * canvas_width + x) + 3] !== a) {
            return false;
        }
        return true;
    }

    function dfs(x, y,r, g, b, a, start_r, start_g, start_b, start_a, data) {
        let stack = [];
        stack.push({'x': x, 'y': y});
        while (stack.length !== 0) {
            let vertex = stack[stack.length - 1];
            x = vertex.x;
            y = vertex.y;
            stack.pop();
            paint_pixel(data, x, y, r, g, b, a);
            if (check_pixel(x + 1, y, start_r, start_g, start_b, start_a, data)) {
                stack.push({'x': x + 1, 'y': y});
            }
            if (check_pixel(x - 1, y, start_r, start_g, start_b, start_a, data)) {
                stack.push({'x': x - 1, 'y': y});
            }
            if (check_pixel(x, y + 1, start_r, start_g, start_b, start_a, data)) {
                stack.push({'x': x, 'y': y + 1});
            }
            if (check_pixel(x, y - 1, start_r, start_g, start_b, start_a, data)) {
                stack.push({'x': x, 'y': y - 1});
            }
            paint_pixel(data, x + 1, y, r, g, b, a);
            paint_pixel(data, x - 1, y, r, g, b, a);
            paint_pixel(data, x, y + 1, r, g, b, a);
            paint_pixel(data, x, y - 1, r, g, b, a);
        }
    }

    function hex_to_rgba(hex){
        let color = hex.substring(1).split('');
        if (color.length === 3){
            color = [color[0], color[0], color[1], color[1], color[2], color[2]];
        }
        color = '0x' + color.join('');
        return {'r': (color >> 16) & 255, 'g': (color >> 8) & 255, 'b': color & 255};
    }

    function fill(x, y) {
        let image_data = a_ctx.getImageData(0, 0, canvas_width, canvas_height);
        let data = image_data.data;

        const rect = canvas.getBoundingClientRect();
        let real_x = -x_offset + (x - rect.left) / scale;
        let real_y = -y_offset + (y - rect.top) / scale;
        if (!is_mouse_on_canvas(real_x, real_y)) {
            return;
        }
        real_x = Math.floor(real_x);
        real_y = Math.floor(real_y);

        let start_r, start_g, start_b, start_a;
        start_r = data[4 * (real_y * canvas_width + real_x)];
        start_g = data[4 * (real_y * canvas_width + real_x) + 1];
        start_b = data[4 * (real_y * canvas_width + real_x) + 2];
        start_a = data[4 * (real_y * canvas_width + real_x) + 3];

        let r, g, b, a;
        let rgb_obj = hex_to_rgba(color);
        r = rgb_obj.r;
        g = rgb_obj.g;
        b = rgb_obj.b;
        a = transparency * 255;

        if (start_r === r && start_g === g && start_b === b && start_a === a) {
            return;
        }

        dfs(real_x, real_y, r, g, b, a, start_r, start_g, start_b, start_a, data);

        a_ctx.putImageData(image_data, 0, 0);
        draw_footprint();
    }

    canvas.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            undo_ctx.drawImage(a_canvas, 0, 0);

            is_mouse_down = true;
        } else if (event.button === 1) {
            is_wheel_down = true;
        } else if (event.button === 2) {
            is_wheel_down = true;
        }
    });

    canvas.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
            if (current_tool === 0 || current_tool === 1) {
                draw_square(event.x, event.y);
            } else if (current_tool === 2) {
                fill(event.x, event.y);
            }
        }
    });

    document.addEventListener("mouseup", (event) => {
        if (event.button === 0) {
            is_mouse_down = false;
            is_mouse_down_slider = false;
            is_mouse_down_slider_t = false;
            was_here_mouse_down = false;
        } else if (event.button === 1) {
            is_wheel_down = false;
        } else if (event.button === 2) {
            is_wheel_down = false;
        }
    });

    function draw_borders() {
        if (x_offset > 0) {
            ctx.fillStyle = "rgb(211, 211, 211)";
            ctx.fillRect(0, 0, x_offset, canvas.height / scale);
        }
        if (y_offset > 0) {
            ctx.fillStyle = "rgb(211, 211, 211)";
            ctx.fillRect(0, 0, canvas.width / scale, y_offset);
        }
        if (-x_offset + canvas.width / scale >= canvas_width) {
            ctx.fillStyle = "rgb(211, 211, 211)";
            ctx.fillRect(x_offset + canvas_width, 0, canvas.width / scale - x_offset - canvas_width, canvas.height / scale);
        }
        if (-y_offset + canvas.height / scale >= canvas_height) {
            ctx.fillStyle = "rgb(211, 211, 211)";
            ctx.fillRect(0, y_offset + canvas_height, canvas.width / scale, canvas.height / scale - y_offset - canvas_height);
        }
    }

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
            if (current_tool !== 2) {
                const rect = canvas.getBoundingClientRect();
                ctx.globalAlpha = transparency;
                ctx.fillStyle = color;
                a_ctx.globalAlpha = transparency;
                a_ctx.fillStyle = color;

                if (was_here_mouse_down) {
                    if (Math.abs(delta_mouse_x) / scale > width * 1.5 || Math.abs(delta_mouse_y) / scale > width * 1.5) {
                        let scaled_delta_x = Math.abs(delta_mouse_x) / scale;
                        let scaled_delta_y = Math.abs(delta_mouse_y) / scale;
                        let squares_to_add_number = Math.max(scaled_delta_x / width, scaled_delta_y / width);
                        let to_add_x = delta_mouse_x / squares_to_add_number / scale;
                        let to_add_y = delta_mouse_y / squares_to_add_number / scale;
                        let x = (prev_mouse_x - rect.left) / scale;
                        let y = (prev_mouse_y - rect.top) / scale;

                        x = Math.floor(x);
                        y = Math.floor(y);

                        for (let i = 0; i < squares_to_add_number; ++i) {
                            if (!is_mouse_on_canvas(-x_offset + x, -y_offset + y)) {
                                continue;
                            }
                            ctx.fillRect(x - width, y - width, width * 2, width * 2);
                            a_ctx.fillRect(-x_offset + x - width, -y_offset + y - width, width * 2, width * 2);
                            x += to_add_x;
                            y += to_add_y;
                        }
                    }
                }

                draw_square(event.x, event.y);
            }
        }

        if (is_wheel_down) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
            x_offset += delta_mouse_x / scale;
            y_offset += delta_mouse_y / scale;
            draw_footprint();
            draw_borders();
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
            x_offset -= canvas.width / 20 / scale;
            y_offset -= canvas.height / 20 / scale;
        } else if (delta > 0) {
            ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
            scale /= scale_multiplier;
            ctx.scale(1 / scale_multiplier, 1 / scale_multiplier);
            x_offset += canvas.width / 22 / scale;
            y_offset += canvas.height / 22 / scale;
        }
        ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
        draw_footprint();
        draw_borders();
        ctx.restore();
    });

    color_obj.addEventListener("change", (event) => {
        color = color_obj.value;
    });

    function slider_mousemove_listener(event, is_mouse_down_var, slider_obj, stripe_obj) {
        let left_offset_px = event.clientX - slider_obj.offsetLeft;
        if (is_mouse_down_var && Math.floor(left_offset_px / slider_obj.offsetWidth * 100) !== 0) {
            stripe_obj.setAttribute("style", "width: " + left_offset_px.toString() + "px");
            return Math.floor(left_offset_px / slider_obj.offsetWidth * 100);
        }
    }

    slider_obj.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            is_mouse_down_slider = true;
        }
    });

    slider_t_obj.addEventListener("mousedown", (event) => {
        if (event.button === 0) {
            is_mouse_down_slider_t = true;
        }
    });

    slider_obj.addEventListener("mousemove", (event) => {
        let to_change = slider_mousemove_listener(event, is_mouse_down_slider, slider_obj, stripe_obj);
        if (to_change) {
            width = to_change;
        }
    });

    slider_obj.addEventListener("mouseup", (event) => {
        let to_change = slider_mousemove_listener(event, is_mouse_down_slider, slider_obj, stripe_obj);
        if (to_change) {
            width = to_change;
        }
    });

    slider_t_obj.addEventListener("mousemove", (event) => {
        let to_change = slider_mousemove_listener(event, is_mouse_down_slider_t, slider_t_obj, stripe_t_obj) / 100;
        if (to_change) {
            transparency = to_change;
        }
    });

    slider_t_obj.addEventListener("mouseup", (event) => {
        let to_change = slider_mousemove_listener(event, is_mouse_down_slider_t, slider_t_obj, stripe_t_obj) / 100;
        if (to_change) {
            transparency = to_change;
        }
    });

    function disable_tool(tool_id) {
        if (tool_id === 0) {
            brush_obj.setAttribute("style", "border: 1px solid gray");
        } else if (tool_id === 1) {
            eraser_obj.setAttribute("style", "border: 1px solid gray");

            color = prev_color;
            transparency = prev_transparency;
        } else if (tool_id === 2) {
            bucket_obj.setAttribute("style", "border: 1px solid gray");
        }
    }

    function enable_tool(tool_id) {
        if (tool_id === 0) {
            brush_obj.setAttribute("style", "border: 2px solid black");
        } else if (tool_id === 1) {
            eraser_obj.setAttribute("style", "border: 2px solid black");

            prev_color = color;
            color = "#ffffff";
            prev_transparency = transparency;
            transparency = 255;
        } else if (tool_id === 2) {
            bucket_obj.setAttribute("style", "border: 2px solid black");
        }
    }

    function enable_tool_listener(tool_id) {
        if (current_tool === tool_id) {
            return;
        }
        disable_tool(current_tool);
        current_tool = tool_id;
        enable_tool(current_tool);
    }

    brush_obj.addEventListener("click", (event) => {
        enable_tool_listener(0);
    });

    eraser_obj.addEventListener("click", (event) => {
        enable_tool_listener(1);
    });

    bucket_obj.addEventListener("click", (event) => {
        enable_tool_listener(2);
    });

    undo_obj.addEventListener("click", (event) => {
        a_ctx.clearRect(0, 0, canvas_width, canvas_height);
        a_ctx.drawImage(undo_canvas, 0, 0);
        ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);
        draw_footprint();
        draw_borders();
    });

    size_submit_obj.addEventListener("click", (event) => {
        event.preventDefault();
        let width = size_width_obj.value;
        let height = size_height_obj.value;
        let scale_x = width / canvas_width;
        let scale_y = height / canvas_height;
        canvas_width = Number(width);
        canvas_height = Number(height);

        undo_ctx.drawImage(a_canvas, 0, 0);
        a_canvas.width = canvas_width;
        a_canvas.height = canvas_height;
        a_ctx.scale(scale_x, scale_y);
        a_ctx.drawImage(undo_canvas, 0, 0);
        undo_canvas.width = canvas_width;
        undo_canvas.height = canvas_height;
        undo_ctx.drawImage(a_canvas, 0, 0);
        a_ctx.scale(1 / scale_x, 1 / scale_y);

        ctx.clearRect(0, 0, canvas.width / scale, canvas.height / scale);

        draw_footprint();
        draw_borders();
    });

    function handleFiles() {
        const file = this.files[0];
        let img = new Image();
        img.onload = (event) => {
            canvas_width = img.width;
            canvas_height = img.height;

            size_width_obj.value = canvas_width;
            size_height_obj.value = canvas_height;

            a_canvas.width = canvas_width;
            a_canvas.height = canvas_height;
            a_ctx.drawImage(img, 0, 0);

            undo_canvas.width = canvas_width;
            undo_canvas.height = canvas_height;
            undo_ctx.drawImage(a_canvas, 0, 0);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            draw_footprint();
            draw_borders();
        }
        img.src = URL.createObjectURL(file);
    }

    template_obj.addEventListener("change", handleFiles, false);

    download_obj.addEventListener("click", (event) => {
        let link = document.createElement('a');
        link.download = 'file.png';
        link.href = a_canvas.toDataURL()
        link.click();
    }, false);
}
