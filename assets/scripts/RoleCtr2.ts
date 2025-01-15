import { _decorator, Component, Input, input, KeyCode, Node, Quat, tween, Vec2, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
enum BlockState {
    HorizontalX, // 平躺（沿 X 轴）
    HorizontalZ, // 平躺（沿 Z 轴）
    Vertical,    // 竖直
}

@ccclass('RoleCtr2')
export class RoleCtr2 extends Component {
    @property(Node)
    player: Node = null; // 子节点（玩家方块）

    private isMoving:boolean = false;
    private direction: Vec2 = Vec2.ZERO; // 当前方向
    private levelData: number[][]; // 地图数据
    private moveDistance: number  = 1;
    private blockState: BlockState = BlockState.Vertical; // 初始状态为平躺（X 轴方向）


    // 初始化地图数据
    onLoad() {
        this.levelData = [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 2, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 1, 1],
        ];

        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event) {
        console.log("onKeyDown    keyCode = ",event.keyCode,KeyCode.ESCAPE,KeyCode.MOBILE_BACK)
        if(event.keyCode == KeyCode.KEY_W) {
            this.flip(new Vec3(0, 0,-1)); // 向上翻滚
        }else if(event.keyCode == KeyCode.KEY_S) {
            this.flip(new Vec3(0,0, 1)); // 向下翻滚
        }else if(event.keyCode == KeyCode.KEY_A) {
            this.flip(new Vec3(-1, 0,0)); // 向左翻滚
        }else if(event.keyCode == KeyCode.KEY_D) {
            this.flip(new Vec3(1, 0,0)); // 向右翻滚
        }
    }

    start() {

    }

    // 翻转逻辑
    private flip(direction: Vec3) {
        if (this.isMoving) return;
        this.isMoving = true;

        let newState: BlockState; // 新的状态
        let rotationAxis = Vec3.ZERO; // 旋转轴
        let eulerAngles = this.node.eulerAngles.clone();

        let rotation  = this.node.getRotation().clone();
        console.log("flip    getRotation = ",this.node.getRotation())

        let rotateFlag = 0;  // 旋转标志 0 x 1 y 2 z
        // 动态调整锚点（父节点的位置）
        let pivot = this.node.position.clone();
        console.log("flip    direction = ",direction,this.blockState)
        switch (this.blockState) {
            case BlockState.HorizontalX:
                if (direction.x !== 0) {
                    // 水平 X 状态，左右翻转
                    pivot.x += direction.x * this.moveDistance * 1.5;
                    pivot.y = 1;
                    eulerAngles.z = eulerAngles.z + (direction.x * 90) ;
                    rotateFlag = 2;
                    rotationAxis = new Vec3(0, 0, -direction.x); // 绕 Z 轴旋转
                    newState = BlockState.Vertical;
                } else if (direction.z !== 0) {
                    console.log("水平 X 状态，上下翻转   ")
                    // 水平 X 状态，上下翻转a
                    pivot.z += direction.z * this.moveDistance;
                    // pivot.x += direction.z * this.moveDistance* 1.5;
                    pivot.y = 0.5;
                    console.log("=========================",eulerAngles.y,direction.z * 90)
                    eulerAngles.y = eulerAngles.y + (direction.z * 90) ;
                    rotateFlag = 1;
                    console.log("========================= 2",eulerAngles.y)
                    rotationAxis = new Vec3(direction.z, 0, 0); // 绕 X 轴旋转
                    newState = BlockState.HorizontalX;
                }
                break;

            case BlockState.HorizontalZ:
                if (direction.z !== 0) {
                    // 水平 Z 状态，上下翻转
                    pivot.z += direction.z * this.moveDistance * 1.5;
                    pivot.y = 1;
                    eulerAngles.x = eulerAngles.x + (direction.z * 90) ;
                    rotateFlag = 0;
                    rotationAxis = new Vec3(direction.z,0 , 0); // 绕 X 轴旋转
                    newState = BlockState.Vertical;
                } else if (direction.x !== 0) {
                    // 水平 Z 状态，左右翻转
                    pivot.x += direction.x * this.moveDistance;
                    // pivot.z += direction.x * this.moveDistance* 1.5;
                    pivot.y = 0.5;
                    eulerAngles.x = eulerAngles.x + (direction.x * 90) ;
                    rotateFlag = 0;
                    rotationAxis = new Vec3(0, 0, -direction.x); // 绕 Z 轴旋转
                    newState = BlockState.HorizontalZ;
                }
                break;

            case BlockState.Vertical:
                if (direction.x !== 0) {
                    // 竖直状态，左右翻转
                    pivot.x += direction.x * this.moveDistance * 1.5;
                    pivot.y = 0.5;
                    eulerAngles.z = eulerAngles.z + (direction.x * 90) ;
                    rotateFlag = 2;
                    rotationAxis = new Vec3(0, 0, -direction.x); // 绕 Z 轴旋转
                    newState = BlockState.HorizontalX;
                } else if (direction.z !== 0) {
                    // 竖直状态，上下翻转
                    pivot.z += direction.z * this.moveDistance * 1.5;
                    pivot.y = 0.5;
                    eulerAngles.x = eulerAngles.x + (direction.z * 90) ;
                    rotateFlag = 1;
                    rotationAxis = new Vec3(direction.z, 0, 0); // 绕 X 轴旋转
                    newState = BlockState.HorizontalZ;
                }
                break;
        }
        // 使用四元数计算目标旋转
        const currentRotation = this.node.rotation.clone();
        const targetRotation = Quat.rotateAround(
            new Quat(),
            currentRotation,
            rotationAxis.normalize(),
            Math.PI / 2 // 90° 转换为弧度
        );
        console.log("flip    currentRotation = " , currentRotation ,"targetRotation = " ,targetRotation)

        let eulerAngles1 = this.node.eulerAngles.clone();
        let tor = eulerAngles1.add(rotationAxis.multiplyScalar(90));
        let targetEulerAngles = new Vec3();
        targetRotation.getEulerAngles(targetEulerAngles);
        //动画处理
        tween(this.node)
        .to(0.4, {
            eulerAngles: targetEulerAngles,
            rotation: targetRotation, // 旋转 90°
            position : pivot,
        })
        .call(() => {
            this.isMoving = false; // 动画完成，允许下一次输入
            this.blockState = newState; // 更新状态d
            
            console.log("flip    direction =  2222 ",this.blockState)
                // 将子节点位置重置到父节点中心
                // this.player.setPosition(Vec3.ZERO);

                // this.checkBounds(); // 检测是否越界
                // this.checkWinCondition(); // 检测是否完成目标
            })
            .start();
    }

     // 检测是否越界
    private checkBounds() {
        const pos = this.node.position;
        // 假设地图范围为 [0, 0] 到 [10, 10]
        if (pos.x < 0 || pos.z < 0 || pos.x > 10 || pos.z > 10) {
            console.log("失败！方块掉出地图！");
            this.resetGame();
        }
    }

    // 检测是否完成目标
    private checkWinCondition() {
        const goalPos = new Vec3(5, 0, 5); // 假设目标位置为 [5, 0, 5]
        if (
            this.node.position.equals(goalPos) &&
            this.blockState === BlockState.Vertical // 必须竖直站立
        ) {
            console.log("恭喜你完成了关卡！");
        }
    }

    // 重置游戏
    private resetGame() {
        this.node.setPosition(Vec3.ZERO);
        this.node.setRotationFromEuler(Vec3.ZERO);
        this.blockState = BlockState.HorizontalX; // 恢复初始状态
    }
}


