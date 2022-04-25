const background_color = 'white';
const foreground_color = 'black';
const array_size = 155;
const height = 575;
const delay_ms = 10;
let num_comparisons = 0;
let sort_window = document.querySelector('#sort-window');
let start_button = document.querySelector('#start-button');
start_button.addEventListener('click', run);
let special_index = 0;
let main_array = new Array(array_size);

function new_array() {
    main_array = new Array(array_size).fill(0).map(() => Math.floor(Math.random() * height));
}

async function delay(ms = delay_ms) {
    if(ms === 0) return;
    return new Promise(resolve => setTimeout(resolve, ms));
}

const comparison_info = document.querySelector('#num-comparisons');
function update() {
    let updated_sort_window = '';
    const special_index_property_string = ' special-element';
    for(let i = 0; i < array_size; ++i) {
            updated_sort_window += '<div style="height:' + main_array[i] + 'px" class="sort-element ' + (i == special_index ? (special_index_property_string + '"></div>') : '"></div>');
    }
    sort_window.innerHTML = updated_sort_window;
    comparison_info.innerHTML = 'Comparisons: ' + num_comparisons.toLocaleString();
}

function end() {
    let updated_sort_window = '';
    for(let i = 0; i < array_size; ++i) {
            updated_sort_window += '<div style="background-color: green; height:' + main_array[i] + 'px" class="sort-element"></div>';
    }
    sort_window.innerHTML = updated_sort_window;
    special_index = 0;
}

function swap(index1, index2) {
    [main_array[index1], main_array[index2]] = [main_array[index2], main_array[index1]];
}

async function bubble_sort() {
    let did_swap = true;
    for(let i = 0; i < array_size; ++i) {
        if(!did_swap) break;
        did_swap = false;
        for(let j = 0; j < array_size - i - 1; ++j) {
            num_comparisons++;
            if(main_array[j] > main_array[j+1])
            {
                swap(j, j+1);
                did_swap = true;
            }
            special_index = j+1;
            await delay();
            update();
        }
    }
    end();
}

async function merge_sort(async = false) {
    let merge = async(start, end) => {
        let mid = Math.floor((start + end)/2);
        let start2 = mid + 1;
        let index = start2;
        let value = main_array[start2];
        while (start <= mid && start2 <= end) {
            await delay();
            special_index = index;
            update();
            num_comparisons++;
            if (main_array[start] <= main_array[start2]) {
                start++;
            } else {
                index = start2;
                value = main_array[start2];
                while (index != start) {
                    main_array[index] = main_array[index - 1];
                    index--;
                }
                main_array[start] = value;
                start++;
                mid++;
                start2++;
            }
        }
    }
    let merge_sort_helper = async (start, end) => {
        if(start >= end) return;
        if(async) {
            await Promise.all([merge_sort_helper(start, Math.floor((start+end)/2)), merge_sort_helper(Math.floor((start+end)/2) + 1, end)]);
        } else {
            await merge_sort_helper(start, Math.floor((start+end)/2));
            await merge_sort_helper(Math.floor((start+end)/2) + 1, end);
        }
        await merge(start,end);
    }
    await merge_sort_helper(0, array_size-1);
    special_index = -1;
    end();
}

async function quicksort(async = false) {
    let partition = async(start, end) => {
        let pivot = main_array[end];
        let pivot_index = start - 1;
        for(let j = start; j <= end; ++j) {
            num_comparisons++;
            if(main_array[j] <= pivot) {
                pivot_index++;
                swap(pivot_index,j);
            }
            await delay();
            update();
            special_index = pivot_index;
        }
        return pivot_index;
    };

    let quicksort_helper = async(start, end) => {
        if(start >= end) return;
        let pivot = await partition(start, end);
        if(async) {
            await Promise.all([quicksort_helper(start, pivot - 1), quicksort_helper(pivot + 1, end)]);
        } else {
            await quicksort_helper(start, pivot - 1);
            await quicksort_helper(pivot + 1, end);
        }
    };

    await quicksort_helper(0, array_size-1);
    special_index = -1;
    end();
}

async function insertion_sort() {
    let i = 1;
    let j = i;
    while(i < array_size) {
        j = i;
        special_index = i;
        await delay();
        update();
        while(j > 0 && main_array[j-1] > main_array[j]) {
            num_comparisons++;
            special_index = j-1;
            swap(j, j-1);
            await delay();
            update();
            j--;
        }
        i++;
    }
    end();
}

async function heap_sort() {
    let make_heap = async(n, i) => {
        let largest = i;
        let l = 2 * i + 1;
        let r = 2 * i + 2;
        num_comparisons += 2;
        if(l < n && main_array[l] > main_array[largest]) 
            largest = l;
        if(r < n && main_array[r] > main_array[largest])
            largest = r;
        if(largest != i) {
            swap(largest, i);
            await delay();
            special_index = largest;
            update();
            await make_heap(n, largest);
        }
    };

    let heap_sort_helper = async() => {
        for(let i = Math.floor(array_size/2); i >= 0; --i) 
            await make_heap(array_size, i);
        for(let i = array_size - 1; i > 0; --i) {
            swap(0, i);
            await make_heap(i, 0);
        }
        update();
    };

    await heap_sort_helper();
    end();
}

async function counting_sort() {
    let counts = Array(height);
    counts.fill(0);
    for(let i = 0; i < array_size; ++i) {
        counts[main_array[i]]++;
        await delay();
        special_index = i;
        update();
    }
    let sorted = []
    for(let i = 0; i < height; ++i) {
        while(counts[i] > 0) {
            sorted.push(i);
            counts[i]--;
        }
    }
    for(let i = 0; i < array_size; ++i) {
        main_array[i] = sorted[i];
        await delay();
        special_index = i;
        update();
    }
    end();
}

let is_running = false;

let randomize_button = document.querySelector('#randomize');
randomize_button.addEventListener('click', randomize);

function randomize() {
    if(is_running) return;
    new_array();
    update();
}

let shuffle_button = document.querySelector('#shuffle');
shuffle_button.addEventListener('click', shuffle);

function shuffle() {
    if(is_running) return;
    let randomize_current_arr = () => {
        let currentIndex = main_array.length,  randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [main_array[currentIndex], main_array[randomIndex]] = [main_array[randomIndex], main_array[currentIndex]];
        }
    }
    randomize_current_arr();
    update();
}

let sort_choice = "bubble-sort";
function set_button(button) {
    is_running = true;
    button.style.color = 'coral';
    button.style.backgroundColor = 'grey';
};

function unset_button(button) {
    is_running = false;
    button.style.color = 'black';
    button.style.backgroundColor = 'white';
};

async function run() {
    if(is_running) return;
    set_button(start_button);
    set_button(randomize_button);
    set_button(shuffle_button);
    switch(sort_choice) {
        case 'bubble-sort': await bubble_sort(); break;
        case 'merge-sort': await merge_sort(); break;
        case 'merge-sort-async': await merge_sort(async = true); break;
        case 'quicksort': await quicksort(); break;
        case 'quicksort-async': await quicksort(async = true); break;
        case 'insertion-sort': await insertion_sort(); break;
        case 'heap-sort': await heap_sort(); break;
        case 'counting-sort': await counting_sort(); break;
    }
    unset_button(shuffle_button);
    unset_button(randomize_button);
    unset_button(start_button);
    num_comparisons = 0;
}

let sort_dropdown = document.getElementById("sort-dropdown");
let sort_dropdown_button = document.querySelector('.dropbtn');
// Sort Selection Dropdown
function expand_sort_selection() {
    sort_dropdown.classList.toggle("show");
}

window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
            var openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function set_sort(event) {
    console.log(event);
    sort_choice = event.srcElement.name
    let current_sort_choice_string = "";
    switch(event.srcElement.name) {
        case 'bubble-sort': current_sort_choice_string = "Bubble Sort"; break;
        case 'merge-sort': current_sort_choice_string = "Merge Sort"; break;
        case 'merge-sort-async': current_sort_choice_string = "Merge Sort (Async)"; break;
        case 'quicksort': current_sort_choice_string = "Quicksort"; break;
        case 'quicksort-async': current_sort_choice_string = "Quicksort (Async)"; break;
        case 'insertion-sort': current_sort_choice_string = "Insertion Sort"; break;
        case 'heap-sort': current_sort_choice_string = "Heap Sort"; break;
        case 'counting-sort': current_sort_choice_string = "Counting Sort"; break;
    }
    sort_dropdown_button.innerHTML = current_sort_choice_string;
}

let sort_button_set = document.querySelectorAll('.sort-choice-button');
sort_button_set.forEach((element) => element.addEventListener('click', set_sort));

// 0 normal !0 centered
let view_choice = 0;
let display_mode_switch = document.querySelector('#display-mode-switch')
display_mode_switch.addEventListener('click', toggle_mode);
function toggle_mode() {
    if(view_choice === 0) {
        view_choice = 1;
        sort_window.style.setProperty('align-items', 'center');
        display_mode_switch.innerHTML = 'Centered';
    } else {
        view_choice = 0;
        sort_window.style.setProperty('align-items', 'flex-end');
        display_mode_switch.innerHTML = 'Normal';
    }
}

new_array();
update();
