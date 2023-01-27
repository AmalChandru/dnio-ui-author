import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'odp-input-data-selector',
  templateUrl: './input-data-selector.component.html',
  styleUrls: ['./input-data-selector.component.scss']
})
export class InputDataSelectorComponent implements OnInit {

  @Input() edit: any;
  @Input() currNode: any;
  @Input() nodeList: Array<any>;
  @Input() data: any;
  @Output() dataChange: EventEmitter<any>;
  prevNode: any;
  showCustomWindow: boolean;
  constructor() {
    this.edit = { status: true };
    this.dataChange = new EventEmitter();
  }

  ngOnInit(): void {
    this.prevNode = this.nodeList.find(e => e.onSuccess.findIndex(es => es._id == this.currNode._id) > -1);
    console.log(this.data, this.currNode, this.prevNode);
  }

  onSourceChange(type: string) {
    if (!type) {
      this.data = null;
      this.dataChange.emit(null);
    } else {
      this.showCustomWindow = true;
    }
  }

  cancel() {
    this.showCustomWindow = false;
  }
}
