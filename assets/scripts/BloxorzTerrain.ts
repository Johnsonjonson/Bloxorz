import { _decorator, Component, error, instantiate, log, Node, Prefab, resources, TextAsset, Vec2 } from 'cc';
import { BloxorzBlock } from './BloxorzBlock';
import { BloxorzMove } from './BloxorzMove';
import { BloxorzPosition } from './BloxorzPosition';
const { ccclass, property } = _decorator;

interface SpecialTile {
    x: number;
    y: number;
    triggeredTiles: Array<{x: number, y: number}>;
}


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
    @property(Prefab)
    private trigglePrefab: Prefab = null; // 触发地块
    @property(Prefab)
    private replenishPrefab: Prefab = null; // 补充地块

    private temporaryTiles: boolean[][] = []; // 用于存储临时出现的地块状态
    private specialTileGroups: Map<number, {
        trigger: {x: number, y: number},
        targets: Array<{x: number, y: number}>
    }> = new Map();

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
        this.specialTileGroups.clear();
        
        await this.readTextFile(levelFile).then((data) => {
            const lines = data.split('\r\n');
            const tempTargets: Map<string, Array<{x: number, y: number}>> = new Map();
            
            // 第一遍扫描：建立基础地图
            for (let y = 0; y < lines.length; y++) {
                this.map[y] = [];
                for (let x = 0; x < lines[y].length; x++) {
                    const flag = lines[y][x].toString();
                    let floor = null;
                    let yPos = -1;
                    
                    if (flag === 'S') {
                        this.startPos = new BloxorzPosition(y, x);
                        floor = instantiate(this.targetPrefab);
                        this.map[y][x] = true;
                    }
                    else if (flag === 'T') {
                        this.goalPos = new BloxorzPosition(y, x);
                        floor = instantiate(this.targetPrefab);
                        this.map[y][x] = true;
                    }
                    else if (flag === '0') {
                        floor = instantiate(this.backgroundPrefab);
                        this.map[y][x] = true;
                    }
                    else if (flag >= '1' && flag <= '9') {
                        // 特殊触发地块
                        const groupNum = parseInt(flag);
                        floor = instantiate(this.trigglePrefab);
                        this.map[y][x] = true;
                        
                        this.specialTileGroups.set(groupNum, {
                            trigger: {x: y, y: x},
                            targets: []
                        });
                    }
                    else if (flag >= 'a' && flag <= 'i') {
                        // 被触发地块
                        const groupNum = flag.charCodeAt(0) - 'a'.charCodeAt(0) + 1;
                        if (!tempTargets.has(groupNum.toString())) {
                            tempTargets.set(groupNum.toString(), []);
                        }
                        tempTargets.get(groupNum.toString()).push({x: y, y: x});
                        this.map[y][x] = false; // 初始不可通过
                    }
                    else {
                        this.map[y][x] = false;
                    }
                    
                    // 添加背景地块
                    let back = instantiate(this.emptyPrefab);
                    this.node.addChild(back);
                    back.setPosition(x, -3, y);
                    
                    if (floor != null) {
                        this.node.addChild(floor);
                        floor.setPosition(x, yPos, y);
                    }
                }
            }
            
            // 关联触发地块和目标地块
            tempTargets.forEach((targets, groupNum) => {
                const group = this.specialTileGroups.get(parseInt(groupNum));
                if (group) {
                    group.targets = targets;
                }
            });
            
        }).catch((err) => {
            error(err.message || err);
        });
        
        this.initTemporaryTiles();
    }

    private initTemporaryTiles(): void {
        this.temporaryTiles = this.map.map(row => row.map(() => false));
    }

    private checkAndTriggerSpecialTiles(b: BloxorzBlock): void {
        // 检查block的两个位置是否在任何特殊地块上
        this.specialTileGroups.forEach((group, groupNum) => {
            if ((group.trigger.x === b.p1.x && group.trigger.y === b.p1.z) || 
                (group.trigger.x === b.p2.x && group.trigger.y === b.p2.z)) {
                // 触发该组的所有目标地块
                this.triggerTiles(group.targets);
                // 
            }
        });
    }

    private triggerTiles(tiles: Array<{x: number, y: number}>): void {
        // 激活临时地块
        tiles.forEach(tile => {
            if (this.temporaryTiles[tile.x][tile.y] === false && tile.x >= 0 && tile.x < this.temporaryTiles.length &&
                tile.y >= 0 && tile.y < this.temporaryTiles[0].length) {
                this.temporaryTiles[tile.x][tile.y] = true;
                log("触发特殊地块",tile.x,tile.y)
                //地图上添加临时地块
                let back = instantiate(this.replenishPrefab);
                this.node.addChild(back);
                back.setPosition(tile.y, -1, tile.x);
            }
        });
    }

    public resetTemporaryTiles(): void {
        // 重置所有临时地块
        this.initTemporaryTiles();
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

    canHold(block: BloxorzBlock): boolean {
        try {
            // 先检查是否触发特殊地块
            this.checkAndTriggerSpecialTiles(block);
            
            const p1Valid = this.isValidPosition(block.p1.x, block.p1.z);
            const p2Valid = this.isValidPosition(block.p2.x, block.p2.z);
            
            return p1Valid && p2Valid;
        } catch (e) {
            return false;
        }
    }

    private isValidPosition(x: number, z: number): boolean {
        if (x < 0 || z < 0 || x >= this.map.length || z >= this.map[0].length) {
            return false;
        }
        // 检查地图和临时地块
        return this.map[x][z] || this.temporaryTiles[x][z];
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

    checkMove(block: BloxorzBlock): { valid: boolean; newTriggers: number[] } {
        const result = {
            valid: false,
            newTriggers: [] as number[]
        };

        try {
            // 检查基本位置是否有效
            const p1Valid = this.isValidPosition(block.p1.x, block.p1.z);
            const p2Valid = this.isValidPosition(block.p2.x, block.p2.z);
            
            if (!p1Valid || !p2Valid) {
                return result;
            }

            result.valid = true;

            // 检查是否触发特殊地块，不再要求必须竖直
            this.specialTileGroups.forEach((group, groupNum) => {
                if ((group.trigger.x === block.p1.x && group.trigger.y === block.p1.z) || 
                    (group.trigger.x === block.p2.x && group.trigger.y === block.p2.z)) {
                    result.newTriggers.push(groupNum);
                }
            });

            return result;
        } catch (e) {
            return result;
        }
    }
}



