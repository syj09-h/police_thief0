const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 반응형 캔버스
canvas.width = Math.min(window.innerWidth * 0.9, 600);
canvas.height = canvas.width;

const rows = 15;
const cols = 15;
const tileSize = canvas.width / cols;

// 보통 난이도 15x15 미로 (0:길, 1:벽)
const maze = [
    [0,0,1,0,0,0,1,0,0,0,0,1,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
    [0,1,1,0,1,1,1,0,1,1,1,0,1,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1,1,1,0,1,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,1,0,1,1,1,1,0,1,1,1,0,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,0,1,1,1,0,1,1,1,0,1,0,0],
    [0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1,0,1,0,1,0,0],
    [0,0,0,0,0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,1,1,0,1,0,1,1,1,0,1,1,0],
    [0,0,0,0,1,0,0,0,0,0,0,0,0,0,0]
];

let player = {x:0, y:0};
let chaser = {x:14, y:0};
const end = {x:14, y:14};
let gameOver = false;

class Node { constructor(x,y,parent=null){ this.x=x; this.y=y; this.parent=parent; this.g=0; this.h=0; this.f=0;} }

function drawMaze(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<rows;y++){
        for(let x=0;x<cols;x++){
            ctx.fillStyle = maze[y][x]===1 ? "#0000FF" : "#FFFFFF";
            ctx.fillRect(x*tileSize, y*tileSize, tileSize, tileSize);
            ctx.strokeRect(x*tileSize, y*tileSize, tileSize, tileSize);
        }
    }
    ctx.fillStyle="gold"; ctx.fillRect(end.x*tileSize,end.y*tileSize,tileSize,tileSize);
    ctx.fillStyle="#000000"; ctx.fillRect(player.x*tileSize,player.y*tileSize,tileSize,tileSize);
    ctx.fillStyle="#1E90FF"; ctx.fillRect(chaser.x*tileSize,chaser.y*tileSize,tileSize,tileSize);
}

function movePlayer(dx,dy){
    if(gameOver) return;
    const newX = player.x + dx;
    const newY = player.y + dy;

    // 벽 통과 불가, 길만 이동 가능
    if(newX>=0 && newX<cols && newY>=0 && newY<rows && maze[newY][newX] === 0){
        player.x = newX;
        player.y = newY;
    }

    drawMaze();
    checkWin();
}

function checkWin(){ 
    if(player.x===end.x && player.y===end.y){ 
        document.getElementById("message").textContent="🎉 미로 탈출 성공!"; 
        gameOver=true; 
    } 
}

function checkLose(){ 
    if(player.x===chaser.x && player.y===chaser.y){ 
        document.getElementById("message").textContent="💀 추격자에게 잡혔습니다!"; 
        gameOver=true; 
    } 
}

// 추격자 AI(A* 알고리즘)
function moveChaser(){
    if(gameOver) return;
    const openList=[], closedList=[];
    const startNode=new Node(chaser.x,chaser.y);
    const endNode=new Node(player.x,player.y);
    openList.push(startNode);

    while(openList.length>0){
        let current = openList.reduce((a,b)=>a.f<b.f?a:b);
        if(current.x===endNode.x && current.y===endNode.y){
            let path=[], temp=current;
            while(temp.parent){ path.push(temp); temp=temp.parent; }
            path.reverse();
            if(path.length>0){ chaser.x=path[0].x; chaser.y=path[0].y; }
            drawMaze(); checkLose(); return;
        }
        openList.splice(openList.indexOf(current),1);
        closedList.push(current);

        const neighbors=[
            {x:current.x+1,y:current.y},{x:current.x-1,y:current.y},
            {x:current.x,y:current.y+1},{x:current.x,y:current.y-1}
        ];

        for(let n of neighbors){
            if(n.x<0||n.x>=cols||n.y<0||n.y>=rows) continue;
            if(maze[n.y][n.x]===1) continue; // 벽은 통과 불가
            if(closedList.find(c=>c.x===n.x && c.y===n.y)) continue;
            let neighborNode=new Node(n.x,n.y,current);
            neighborNode.g=current.g+1;
            neighborNode.h=Math.abs(neighborNode.x-endNode.x)+Math.abs(neighborNode.y-endNode.y);
            neighborNode.f=neighborNode.g+neighborNode.h;
            const existing=openList.find(o=>o.x===neighborNode.x && o.y===neighborNode.y);
            if(existing && existing.g<=neighborNode.g) continue;
            openList.push(neighborNode);
        }
    }
}

// 키보드 이동
document.addEventListener("keydown",(e)=>{
    switch(e.key){
        case "ArrowUp": movePlayer(0,-1); break;
        case "ArrowDown": movePlayer(0,1); break;
        case "ArrowLeft": movePlayer(-1,0); break;
        case "ArrowRight": movePlayer(1,0); break;
    }
});

// 모바일 버튼
const controls=document.getElementById("mobile-controls");
["Up","Down","Left","Right"].forEach(dir=>{
    const btn=document.createElement("button");
    btn.textContent = dir;
    btn.addEventListener("touchstart",(e)=>{
        e.preventDefault();
        switch(dir){
            case "Up": movePlayer(0,-1); break;
            case "Down": movePlayer(0,1); break;
            case "Left": movePlayer(-1,0); break;
            case "Right": movePlayer(1,0); break;
        }
    });
    controls.appendChild(btn);
});

// 추격자 속도
setInterval(moveChaser, 300);

drawMaze();
