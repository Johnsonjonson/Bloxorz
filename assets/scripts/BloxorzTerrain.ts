import { _decorator, Component, error, instantiate, log, Node, Prefab, resources, TextAsset, Vec2 } from 'cc';
import { BloxorzBlock } from './BloxorzBlock';
import { BloxorzMove } from './BloxorzMove';
import { BloxorzPosition } from './BloxorzPosition';
const { ccclass, property } = _decorator;

@ccclass('BloxorzTerrain')
export class BloxorzTerrain extends Component {


    private map: boolean[][] = [];
    private startPos:BloxorzPosition = null;
    private goalPos:BloxorzPosition = null;
    @property(Prefab)
    private backgroundPrefab: Prefab = null;
    @property(Prefab)
    private targetPrefab: Prefab = null;
    @property(Prefab)
    private emptyPrefab: Prefab = null;


    start() {
        // this.parseTerrain('levels/level01')
    }

    async readTextFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            resources.load(filePath, (err: any, res: TextAsset) => {
                if (err) {
                    error(err.message || err);
                    reject(err);
                    return;
                }
                resolve(res.text);
            });
        });
    }


    async parseTerrain(levelFile: string) {
        this.node.removeAllChildren();
        await this.readTextFile(levelFile).then((data) => {
            const lines = data.split('\r\n');
            // const height = lines.length;
            // const width = lines[0].length;

            // for (let y = 0; y < lines.length; y++) {
            //     this.map[y] = [];
            //     for (let x = 0; x < lines[y].length; x++) {
            //         let flag = lines[y][x].toString();
            //         let floor;
            //         let yPos = -1;
    
            //         // 计算转换后的坐标
            //         // 将y坐标翻转，使左下角成为原点
            //         const transformedZ = height - 1 - y;
            //         // x坐标向右偏移半个地图宽度
            //         const transformedX = x - width / 2;
    
            //         if (flag == 'S') {
            //             this.startPos = new BloxorzPosition(y, x);
            //             floor = instantiate(this.targetPrefab);
            //             this.map[y][x] = true;
            //         } else if (flag == 'T') {
            //             floor = instantiate(this.targetPrefab);
            //             this.goalPos = new BloxorzPosition(y, x);
            //             this.map[y][x] = true;
            //         } else if (flag == '0') {
            //             floor = instantiate(this.backgroundPrefab);
            //             this.map[y][x] = true;
            //         } else if (flag == '-') {
            //             this.map[y][x] = false;
            //         }
    
            //         let back = instantiate(this.emptyPrefab);
            //         this.node.addChild(back);
            //         // 使用转换后的坐标
            //         back.setPosition(transformedX, -3, transformedZ);
    
            //         if (floor != null) {
            //             this.node.addChild(floor);
            //             floor.setPosition(transformedX, yPos, transformedZ);
            //         }
            //     }
            // }

            // lines.forEach((line, x) => {
            //     const row: boolean[] = [];
            //     [...line].forEach((char, y) => {
            //         let floor
            //         let yPos = -1;
            //         switch(char) {
            //             case 'S':
            //                 floor = instantiate(this.targetPrefab);
            //                 this.startPos = new BloxorzPosition(x, y);
            //                 row.push(true);
            //                 break;
            //             case 'T':
            //                 floor = instantiate(this.targetPrefab);
            //                 this.goalPos = new BloxorzPosition(x, y);
            //                 row.push(true);
            //                 break;
            //             case '0':
            //                 floor = instantiate(this.backgroundPrefab);
            //                 row.push(true);
            //                 break;
            //             case '-':
            //                 row.push(false);
            //                 break;
            //         }
            //         let back = instantiate(this.emptyPrefab);
            //         this.node.addChild(back);
            //         back.setPosition(x , -3,y);

            //         if (floor != null){
            //             this.node.addChild(floor);
            //             floor.setPosition(x , yPos ,y)
            //         }
            //     });
            //     if (row.length > 0) {
            //         this.map.push(row);
            //     }
                
            // });


            log(lines);
            for (let y = 0; y < lines.length; y++){
                this.map[y] = [];
                for (let x = 0; x < lines[y].length; x++) {
                    let flag = lines[y][x].toString();
                    let floor
                    let yPos = -1;
                    if (flag == 'S') {
                        this.startPos = new BloxorzPosition(y, x);
                        // floor = instantiate(this.backgroundPrefab);
                        floor = instantiate(this.targetPrefab);
                        this.map[y][x] = true;
                    }else if (flag == 'T') {
                        floor = instantiate(this.targetPrefab);
                        this.goalPos =new BloxorzPosition(y, x);
                        
                        this.map[y][x] = true;
                    }else if (flag == '0'){
                        floor = instantiate(this.backgroundPrefab);
                        this.map[y][x] = true;
                    }else if (flag == '-'){
                        // floor = instantiate(this.emptyPrefab);
                        this.map[y][x] = false;
                        // yPos = -3;
                    }
                    let back = instantiate(this.emptyPrefab);
                    this.node.addChild(back);
                    back.setPosition(x , -3,y);

                    if (floor != null){
                        this.node.addChild(floor);
                        floor.setPosition(x , yPos ,y)
                    }
                }
            }
            log(this.map);
        }).catch((err) => {
            error(err.message || err);
        });
    }


    getStart() {
        return this.startPos;
    }

    getGoal() {
        return this.goalPos;
    }

    getMap() {
        return this.map;
    }

    update(deltaTime: number) {
        
    }

    done(b: BloxorzBlock): boolean {
        let isStanding = b.isStanding();
        let isGoal = this.goalPos !== null && ((b.p1.x === this.goalPos.x && b.p1.z === this.goalPos.z) || (b.p2.x === this.goalPos.x && b.p2.z === this.goalPos.z));
        log("done",this.goalPos,b.p1,b.p2)
        log(`isStanding: ${isStanding}, isGoal: ${isGoal}`)
        return isStanding && isGoal;
    }

    canHold(block: BloxorzBlock) {
        try{
            return this.map[block.p1.x][block.p1.z] && this.map[block.p2.x][block.p2.z];
        }catch (e) {
            return false;
        }
    }

    neighbours(block: BloxorzBlock) {
        return [{ block: block.up(), move: BloxorzMove.Up },
            { block: block.down(), move: BloxorzMove.Down },
            { block: block.left(), move: BloxorzMove.Left },
            { block: block.right(), move: BloxorzMove.Right }]
    }

    legalNeighbors(b: BloxorzBlock): { block: BloxorzBlock, move: BloxorzMove }[] {
        return this.neighbours(b).filter(n => this.canHold(n.block));
    }
}


