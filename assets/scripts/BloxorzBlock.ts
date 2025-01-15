import { _decorator, Component, Node } from 'cc';
import { BloxorzPosition } from './BloxorzPosition';
const { ccclass, property } = _decorator;

@ccclass('BloxorzBlock')
export class BloxorzBlock extends Component {
    p1: BloxorzPosition;
    p2: BloxorzPosition;

    constructor(p1, p2) {
        super();
        this.p1 = p1;
        this.p2 = p2;
    }

    isStanding() {
        return this.p1.z == this.p2.z && this.p1.x == this.p2.x;
    }

    left(){
        if (this.isStanding()) {
           return this.dz(-2,-1);
        }else if (this.p1.x == this.p2.x) {
            return this.dz(-1,-2);
        }else{
            return this.dz(-1,-1);
        }
    }

    right(){
        if (this.isStanding()) {
           return this.dz(1,2);
        }else if (this.p1.x == this.p2.x) {
            return this.dz(2,1);
        }else{
            return this.dz(1,1);
        }
    }

    up(){
        if (this.isStanding()) {
           return this.dx(-2,-1);
        }else if (this.p1.x == this.p2.x) {
            return this.dx(-1,-1);
        }else{
            return this.dx(-1,-2);
        }

    }

    down(){
        if (this.isStanding()) {
           return this.dx(1,2);
        }else if (this.p1.x == this.p2.x) {
            return this.dx(1,1);
        }else{
            return this.dx(2,1);
        }
        
    }

    dx(d1:number, d2:number){
        return new BloxorzBlock(this.p1.dx(d1),this.p2.dx(d2));
    }

    dz(d1:number, d2:number){
        return new BloxorzBlock(this.p1.dz(d1),this.p2.dz(d2));
    }
}


