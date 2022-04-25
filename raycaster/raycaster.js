const size = 500;
const max_dist = 300;
const grid_size = 25;
let start_angle = 0;
let unit_width = Math.floor(size/grid_size);

const window_2d = document.querySelector('#raycaster-2d-window');
const window_3d = document.querySelector('#raycaster-3d-window');

window_2d.width = window_2d.height = size;
window_3d.width = window_3d.height = size;

const ctx2d = window_2d.getContext('2d');
const ctx3d = window_3d.getContext('2d');

const foreground_color = 'white';
const background_color = 'green';
const stroke_color = 'yellow';
const floor_color = 'green';
const sky_color = 'cornflowerblue';

let player_position = {
    x: size/2,
    y: size/2,
};

// false (no wall) true (wall)
let grid = new Array(grid_size).fill(false).map(() => new Array(grid_size).fill(false));
let construct_outer_wall = () => {
    for(let i = 0; i < grid_size; ++i) {
        grid[0][i] = true;
        grid[i][0] = true;
        grid[grid_size-1][i] = true;
        grid[i][grid_size-1] = true;
    }
};

let draw_rect = (x, y, width, height, context, color = foreground_color) => {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
}

let draw_circle = (x, y, r) => {
    ctx2d.strokeStyle = foreground_color;
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.arc(x, y, r, 0, Math.PI * 2);
    ctx2d.stroke();
}

let draw_round_rect = (x, y, width, height, radius, context, color = 'red') => {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x+radius, y);
    context.arcTo(x+width, y,   x+width, y+height, radius);
    context.arcTo(x+width, y+height, x,   y+height, radius);
    context.arcTo(x,   y+height, x,   y,   radius);
    context.arcTo(x,   y,   x+width, y,   radius);
    context.closePath();
    context.stroke();
}

let draw_line = (x1, y1, x2, y2, color = stroke_color) => {
    ctx2d.strokeStyle = color;
    ctx2d.lineWidth = 3;
    ctx2d.beginPath();
    ctx2d.moveTo(x1, y1);
    ctx2d.lineTo(x2, y2);
    ctx2d.stroke();
}


let clearmap = () => {
    draw_rect(0,0,size,size,ctx2d,background_color);
} 

let clearthreed = () => {
    draw_rect(0,0,size, size/2, ctx3d, sky_color);
    draw_rect(0,size/2, size, size/2, ctx3d, floor_color);
}

let update = () => {
    clearmap();
    clearthreed();
    draw_circle(player_position.x, player_position.y, 10);
    for(let i = 0; i < grid_size; ++i) {
        for(let j = 0; j < grid_size; ++j) {
            if(grid[i][j]) {
                draw_rect(i*unit_width, j*unit_width, (unit_width), (unit_width), ctx2d);
            }
        }
    }
    let fov = 360;
    let fov_ang = Math.PI * (1/3);
    let angle = start_angle - fov_ang/2;
    let iter = fov_ang / fov;
    for(let i = 0; i < fov; ++i) {
        let direction = {x: Math.cos(angle), y: Math.sin(angle)};
        let intersect_distance = intersect_calculator(player_position, direction);
        let norm_angle = start_angle - angle;
        let r_height = intersect_distance;
        if(r_height < 0) r_height = 0;
        r_height *= Math.cos(norm_angle);
        r_height = 20 * size/r_height;
        let norm_ratio = (max_dist + 200 - intersect_distance)/max_dist;
        let color = 'rgb(' + 10 * Math.floor(25 * norm_ratio) + ',' + 10 * Math.floor(25 * norm_ratio)+ ',' + 10 * Math.floor(25 * norm_ratio) + ')';
        draw_rect(i * (size/fov), (size-r_height)/2, size/fov + 2, r_height, ctx3d, color);
        let intersect_point = get_intersect_point(player_position, intersect_distance, direction);
        draw_line(player_position.x, player_position.y, intersect_point.x, intersect_point.y);
        // draw_circle(intersect_point.x, intersect_point.y, 3);
        angle += iter;
    }
    do_keys();
}



let get_relative_mouse_position = ({x, y}) => {
    const window_bounds_rect = window_2d.getBoundingClientRect();
    const window_bounds = {
        x: window_bounds_rect.left,
        y: window_bounds_rect.top,
    };
    return {
        x: x - window_bounds.x,
        y: y - window_bounds.y,
    };
}

let get_grid_coords = ({x, y}) => {
    return {
        i: Math.floor(x/unit_width),
        j: Math.floor(y/unit_width),
    };
}

let update_grid = (coords) => {
    let relative_coords = get_relative_mouse_position(coords);
    let grid_coords = get_grid_coords(relative_coords);
    if(grid_coords.i < 0 || grid_coords.j < 0 || grid_coords.i >= grid_size || grid_coords.j >= grid_size) return;
    grid[grid_coords.i][grid_coords.j] = true;
}

let is_mouse_held = false;
let mouse_click = (event) => {
    is_mouse_held = true;
    let coords = {
        x: event.clientX,
        y: event.clientY,
    };
    update_grid(coords);
}

let mouse_move = (event) => {
    let coords = {
        x: event.clientX,
        y: event.clientY,
    };
    if(!is_mouse_held) return;
    update_grid(coords);
}

let mouse_release = () => {
    is_mouse_held = false;
}

document.addEventListener('mousedown', mouse_click);
document.addEventListener('mouseup', mouse_release);
document.addEventListener('mousemove', mouse_move);

let intersect_calculator = (origin, orig_direction) => {

    let direction = orig_direction;

    let slope = {
        x: direction.y/direction.x,
        y: direction.x/direction.y,
    };

    let ray_unit_step = {
        x: Math.sqrt(1 + (slope.x * slope.x)),
        y: Math.sqrt(1 + (slope.y * slope.y)),
    };

    let curr_map = {
        x: Math.floor(origin.x),
        y: Math.floor(origin.y),
    }

    let ray_len = {
        x: 0,
        y: 0,
    };

    let step = {
        x: 0,
        y: 0,
    };
    if(direction.x < 0) {
        step.x = -1;
        ray_len.x = (origin.x - Math.floor(origin.x)) * ray_unit_step.x;
    } else {
        step.x = 1;
        ray_len.x = (Math.floor(origin.x + 1) - origin.x) * ray_unit_step.x;
    }

    if(direction.y < 0) {
        step.y = -1;
        ray_len.y = (origin.y - Math.floor(origin.y)) * ray_unit_step.y;
    } else {
        step.y = 1;
        ray_len.y = (Math.floor(origin.y + 1) - origin.y) * ray_unit_step.y;
    }
    let distance = 0;
    while(distance < max_dist) {
        if(ray_len.x < ray_len.y) {
            curr_map.x += step.x;
            distance = ray_len.x;
            ray_len.x += ray_unit_step.x;
        } else {
            curr_map.y += step.y;
            distance = ray_len.y;
            ray_len.y += ray_unit_step.y;
        }
        let grid_coords = get_grid_coords(curr_map);
        if(grid_coords.i < 0 || grid_coords.j < 0 || grid_coords.i >= grid_size || grid_coords.j >= grid_size) return distance;
        if(grid[grid_coords.i][grid_coords.j]) {
            return distance;
        }
    }
    return max_dist;
}

let get_intersect_point = (origin, distance, direction) => {
    return {
        x: origin.x + distance * direction.x,
        y: origin.y + distance * direction.y,
    };
}

let move_forward = async(forward = true) => {
    let dir = {
        x: Math.cos(start_angle),
        y: Math.sin(start_angle),
    };
    // First move player then check whether the position is incorrect.
    player_position.x += dir.x * 2.5;
    let grid_coords = get_grid_coords(player_position);
    if(player_position.x < 1) player_position.x = 1;
    else if(player_position.x >= size - 1) player_position.x = size - 1;
    else if(grid[grid_coords.i][grid_coords.j]) player_position.x -= dir.x * 2.5;

    player_position.y += dir.y * 2.5;
    grid_coords = get_grid_coords(player_position);
    if(player_position.y < 1) player_position.y = 1;
    else if(player_position.y >= size - 1) player_position.y = size - 1;
    else if(grid[grid_coords.i][grid_coords.j]) player_position.y -= dir.y * 2.5;
};

let move_backward = async(forward = true) => {
    let dir = {
        x: Math.cos(start_angle),
        y: Math.sin(start_angle),
    };
    // First move player then check whether the position is incorrect.
    player_position.x -= dir.x * 2.5;
    let grid_coords = get_grid_coords(player_position);
    if(player_position.x < 1) player_position.x = 1;
    if(player_position.x >= size - 1) player_position.x = size - 1;
    if(grid[grid_coords.i][grid_coords.j]) player_position.x += dir.x * 2.5;

    player_position.y -= dir.y * 2.5;
    grid_coords = get_grid_coords(player_position);
    if(player_position.y < 1) player_position.y = 1;
    if(player_position.y >= size - 1) player_position.y = size - 1;
    if(grid[grid_coords.i][grid_coords.j]) player_position.y += dir.y * 2.5;
};

const controller = {
    'w': { pressed: false, func: move_forward },
    'a': { pressed: false, func: () => { 
        start_angle -= 0.08;
        start_angle %= -Math.PI * 2;
    } },
    's': { pressed: false, func: move_backward },
    'd': { pressed: false, func: () => {
        start_angle += 0.08;
        start_angle %= Math.PI * 2;
    } },
};

var keyPressed = {};
document.addEventListener('keydown', function(e) {
    if(controller[e.key]) {
        controller[e.key].pressed = true;
    }
}, false);

document.addEventListener('keyup', function(e) {
    if(controller[e.key]) {
        controller[e.key].pressed = false;
    }
}, false);

let do_keys = () => {
    Object.keys(controller).forEach(key => {
        controller[key].pressed && controller[key].func()  
    });
};

setInterval(update, 16);


document.getElementById('sample-map').addEventListener('click', () => {
    let sample_map = [
        [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        [false,true,true,true,true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false],
        [false,true,false,false,true,false,false,false,false,false,false,false,false,true,true,true,true,true,true,true,true,true,true,false,false],
        [false,true,false,false,true,false,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,true,false,false],
        [false,true,false,false,true,false,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,true,false,false],
        [false,true,false,false,true,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false],
        [false,true,false,false,true,false,false,true,false,false,true,false,false,true,true,true,true,true,true,true,true,false,true,false,false],
        [false,true,false,false,true,true,true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false,true,false,false],
        [false,true,false,false,false,true,false,true,false,true,false,true,false,true,false,true,true,false,true,true,false,false,true,false,false],
        [false,true,false,false,false,false,false,false,false,false,false,false,false,true,false,true,true,false,true,true,false,false,true,false,false],
        [false,true,false,false,false,true,false,false,true,false,true,false,false,true,false,false,false,false,false,false,false,false,true,false,false],
        [false,true,true,false,false,true,true,true,true,true,true,true,true,true,false,false,false,false,false,false,false,false,true,false,false],
        [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,true,true,false,false],
        [false,true,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        [false,false,true,false,false,true,false,false,false,false,false,false,false,false,false,true,false,true,false,false,false,false,false,false,false],
        [false,false,false,true,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        [false,false,true,false,false,true,false,false,false,false,false,false,false,false,false,true,false,true,false,false,false,false,false,false,false],
        [false,true,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
        [false,true,false,true,false,true,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,false,false],
        [false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false],
        [false,true,false,true,false,true,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false],
        [false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false,false,false],
        [false,true,false,true,false,true,false,true,true,true,true,true,true,true,true,false,false,false,false,false,false,true,false,false,false],
        [false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false],
    ];
    grid = sample_map;
});

document.querySelector('#clear-map').addEventListener('click', () => {
    grid = new Array(grid_size).fill(false).map(() => new Array(grid_size).fill(false));
});

// let h = document.getElementById('hi');

// let print_array = () => {
//     for(const row of grid) {
//         for(const elem of row) {
//             h.innerHTML += elem + ',';
//         } h.innerHTML += '<br>';
//     }
// };

// document.getElementById('btn').addEventListener('click', print_array);