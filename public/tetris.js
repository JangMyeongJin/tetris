const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score-value');

context.scale(20, 20);

const nextCanvas = document.getElementById('next-piece');
const nextContext = nextCanvas.getContext('2d');

nextContext.scale(20, 20);

// 테트리스 블록 모양 정의
const pieces = [
    [
        [1, 1],
        [1, 1]
    ],
    [
        [0, 2, 0],
        [2, 2, 2]
    ],
    [
        [0, 3, 3],
        [3, 3, 0]
    ],
    [
        [4, 4, 0],
        [0, 4, 4]
    ],
    [
        [5, 5, 5, 5]
    ],
    [
        [6, 6, 6],
        [0, 6, 0]
    ],
    [
        [7, 7, 7],
        [7, 0, 0]
    ]
];

// 게임 상태에 paused 추가
const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    nextPiece: null
};

let paused = false;

const arena = createMatrix(12, 20);

// 매트릭스 생성 함수
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// 충돌 감지 함수
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// drawMatrix 함수 수정 (context 매개변수 추가)
function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x,
                             y + offset.y,
                             1, 1);
            }
        });
    });
}

// 게임 화면 그리기 함수
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
}

// 매트릭스 병합 함수
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 플레이어 드롭 함수
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// 플레이어 하드 드롭 함수 추가
function playerHardDrop() {
    while (!collide(arena, player)) {
        player.pos.y++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
}

// 플레이어 이동 함수
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// playerReset 함수 수정
function playerReset() {
    const pieces = 'TOLJISZUPXW';
    if (player.nextPiece === null) {
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    } else {
        player.matrix = player.nextPiece;
        player.nextPiece = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) -
                   (player.matrix[0].length / 2 | 0);
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));
        player.score = 0;
        updateScore();
    }
    drawNextPiece();
}

// 플레이어 회전 함수
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 매트릭스 회전 함수
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

// update 함수 수정
function update(time = 0) {
    if (paused) {
        requestAnimationFrame(update);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        player.pos.y++;
        if (collide(arena, player)) {
            player.pos.y--;
            merge(arena, player);
            playerReset();
            arenaSweep();
            updateScore();
        }
        dropCounter = 0;
    }

    draw();
    requestAnimationFrame(update);
}

// 일시정지 토글 함수 추가
function togglePause() {
    paused = !paused;
    if (paused) {
        context.fillStyle = 'rgba(0, 0, 0, 0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = 'white';
        context.font = '1px Arial';
        context.fillText('PAUSED', 3, 10);
    }
    document.getElementById('pause-button').textContent = paused ? '재개' : '일시정지';
}

// 다음 블록 그리기 함수
function drawNextPiece() {
    nextContext.fillStyle = '#000';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    drawMatrix(player.nextPiece, {x: 1, y: 1}, nextContext);
}

// 아레나 스윕 함수
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        rowCount *= 2;
    }
}

// 점수 업데이트 함수
function updateScore() {
    scoreElement.innerText = player.score;
}

// createPiece 함수 수정
function createPiece(type) {
    switch(type) {
        case 'T': return [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ];
        case 'O': return [
            [2, 2],
            [2, 2],
        ];
        case 'L': return [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ];
        case 'J': return [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ];
        case 'I': return [
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
            [0, 5, 0, 0],
        ];
        case 'S': return [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ];
        case 'Z': return [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ];
        // 새로운 블록 추가
        case 'U': return [
            [8, 0, 8],
            [8, 8, 8],
            [0, 0, 0],
        ];
        case 'P': return [
            [9, 9, 0],
            [9, 9, 0],
            [9, 0, 0],
        ];
        case 'X': return [
            [0, 10, 0],
            [10, 10, 10],
            [0, 10, 0],
        ];
        case 'W': return [
            [11, 0, 0],
            [11, 11, 0],
            [0, 11, 11],
        ];
    }
}

const colors = [
    null,
    '#FF0D72', // T
    '#0DC2FF', // O
    '#0DFF72', // L
    '#F538FF', // J
    '#FF8E0D', // I
    '#FFE138', // S
    '#3877FF', // Z
    '#FF00FF', // U (마젠타)
    '#00FFFF', // P (시안)
    '#FFFFFF', // X (흰색)
    '#FFA500', // W (주황색)
];

// 일시정지 버튼 이벤트 리스너 추가
document.getElementById('pause-button').addEventListener('click', togglePause);

// 이벤트 리스너 수정
document.addEventListener('keydown', event => {
    if (!paused) {
        if (event.keyCode === 37) {
            playerMove(-1);
        } else if (event.keyCode === 39) {
            playerMove(1);
        } else if (event.keyCode === 38) {
            playerRotate(-1);
        } else if (event.keyCode === 40) {
            playerRotate(1);
        } else if (event.keyCode === 32) {
            playerHardDrop();
        }
    }
    if (event.keyCode === 80) { // 'P' 키
        togglePause();
    }
});

playerReset();
updateScore();
update();