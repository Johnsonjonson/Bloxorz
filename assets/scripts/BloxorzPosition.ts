import { _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('BloxorzPosition')
export class BloxorzPosition{
    x: number;
    z: number;

    constructor(x:number,z:number){
        this.x = x;
        this.z = z;
    }


    dx(dx:number){
        return new BloxorzPosition(this.x+dx,this.z);
    }

    dz(dz:number){
        return new BloxorzPosition(this.x,this.z+dz);
    }

}


