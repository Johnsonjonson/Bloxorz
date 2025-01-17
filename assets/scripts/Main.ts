import { _decorator, Component, error, EventTouch, Input, input, instantiate, KeyCode, log, Node, Prefab, resources, TextAsset, tween, Vec3 } from 'cc';
import { BloxorzTerrain } from './BloxorzTerrain';
import { RoleCtr2 } from './RoleCtr2';
import { RoleCtr } from './RoleCtr';
import { BloxorzBlock } from './BloxorzBlock';
import { AStarSolver } from './AStarSolver';
import { BloxorzMove } from './BloxorzMove';
const { ccclass, property } = _decorator;

@ccclass('main')
export class main extends Component {
    @property(Node)
    private groundNode: Node = null;

    @property(Node)
    private blockNode: Node = null;

    bloxorzBlock: BloxorzBlock;
    bloxorzTerrain: any;
    level: number;

    protected onLoad(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event) {
        let roleCtr = this.blockNode.getComponent(RoleCtr)
        if (roleCtr.getIsMoving()) {
            return
        }
        console.log("onKeyDown    keyCode = ",event.keyCode,KeyCode.ESCAPE,KeyCode.MOBILE_BACK)
        if(event.keyCode == KeyCode.KEY_W) {
            let nextBlock = this.bloxorzBlock.up()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(0, 0,-1)); // 向上翻滚
            }
        }else if(event.keyCode == KeyCode.KEY_S) {
            let nextBlock = this.bloxorzBlock.down()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(0,0, 1)); // 向下翻滚
            }
        }else if(event.keyCode == KeyCode.KEY_A) {
            let nextBlock = this.bloxorzBlock.left()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(-1, 0,0)); // 向左翻滚
            }
        }else if(event.keyCode == KeyCode.KEY_D) {
            let nextBlock = this.bloxorzBlock.right()
            if(this.bloxorzTerrain.canHold(nextBlock)) {
                this.bloxorzBlock = nextBlock
                roleCtr.flip(new Vec3(1, 0,0)); // 向右翻滚
            }
        }
        log("=================================move",this.bloxorzBlock)
        tween(this.blockNode).delay(0.5).call(
            () => {
                if (this.bloxorzTerrain.done(this.bloxorzBlock)){
                    this.level ++
                    this.updateTerrain()
                    log("done!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                }
            }
        ).start()
        
    }

    start() {
        this.level = 8;
        this.updateTerrain();
    }

    async updateTerrain() {
        let level = this.level.toString()
        this.bloxorzTerrain = this.groundNode.getComponent(BloxorzTerrain)

        // 加载并解析关卡
        await this.bloxorzTerrain.parseTerrain("levels/level" + level);
        let startPos = this.bloxorzTerrain.getStart()
        let goalPos = this.bloxorzTerrain.getGoal()
        
        console.log("========== 开始关卡验证 ==========");
        console.log("起点位置:", `(${startPos.x}, ${startPos.z})`);
        console.log("终点位置:", `(${goalPos.x}, ${goalPos.z})`);
        console.log("特殊地块：");
        console.log("- 地块1 触发补充地块a");
        console.log("- 地块2 触发补充地块b");
        console.log("- 地块3 触发补充地块c");

        // 执行A*验证
        const solver = new AStarSolver();
        const solution = solver.solve(this.bloxorzTerrain);
        
        if (solution.length > 0) {
            console.log("\n✅ 关卡验证成功！");
            console.log(`总步数: ${solution.length} 步`);
            console.log("\n详细解决方案:");
            
            // 模拟执行解决方案
            let currentBlock = new BloxorzBlock(startPos, startPos);
            console.log(`初始状态: 位置(${startPos.x},${startPos.z}), 竖直站立`);
            
            solution.forEach((move, index) => {
                // 记录当前状态
                const prevState = {
                    p1: {x: currentBlock.p1.x, z: currentBlock.p1.z},
                    p2: {x: currentBlock.p2.x, z: currentBlock.p2.z},
                    standing: currentBlock.isStanding()
                };
                
                // 执行移动
                switch(move) {
                    case BloxorzMove.Left:
                        currentBlock = currentBlock.left();
                        console.log(`${index + 1}. ← 左移`);
                        break;
                    case BloxorzMove.Right:
                        currentBlock = currentBlock.right();
                        console.log(`${index + 1}. → 右移`);
                        break;
                    case BloxorzMove.Up:
                        currentBlock = currentBlock.up();
                        console.log(`${index + 1}. ↑ 上移`);
                        break;
                    case BloxorzMove.Down:
                        currentBlock = currentBlock.down();
                        console.log(`${index + 1}. ↓ 下移`);
                        break;
                }
                
                // 检查是否触发特殊地块
                if (currentBlock.isStanding()) {
                    const pos = currentBlock.p1;
                    if ((pos.x === 2 && pos.z === 4) || // 地块1的位置
                        (pos.x === 3 && pos.z === 4) || // 地块2的位置
                        (pos.x === 5 && pos.z === 4)) { // 地块3的位置
                        console.log(`   触发特殊地块！位置(${pos.x},${pos.z})`);
                    }
                }
                
                console.log(`   位置: (${currentBlock.p1.x},${currentBlock.p1.z}), (${currentBlock.p2.x},${currentBlock.p2.z})`);
                console.log(`   状态: ${currentBlock.isStanding() ? '竖直' : '水平'}`);
            });
            
        } else {
            console.log("\n❌ 警告：该关卡无法通过！");
            console.log("可能的问题：");
            console.log("1. 特殊地块周围缺少足够空间进行竖直站立");
            console.log("2. 补充地块的位置无法形成有效路径");
            console.log("3. 某些特殊地块无法按正确顺序触发");
            console.log("4. 从起点到终点缺少必要的连接路径");
        }

        // 继续原有的初始化逻辑
        this.blockNode.setPosition(startPos.z, 1, startPos.x);
        this.bloxorzBlock = new BloxorzBlock(startPos, startPos);

        tween(this.blockNode).delay(0.5).call(
            () => {
                this.blockNode.setPosition(startPos.z, 1, startPos.x);
            }
        ).start();
    }

    async validateLevel() {
        const solver = new AStarSolver();
        const solution = solver.solve(this.bloxorzTerrain);
        
        if (solution.length > 0) {
            console.log("关卡可通过！最短路径需要", solution.length, "步");
            solution.forEach((move, index) => {
                console.log(`第 ${index + 1} 步: ${BloxorzMove[move]}`);
            });
            return true;
        } else {
            console.log("警告：该关卡无法通过！");
            return false;
        }
    }

    update(deltaTime: number) {
        
    }
}


