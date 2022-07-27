import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import * as _ from 'lodash';

@Component({
  selector: 'odp-user-grid-action',
  template: `<div style="overflow: hidden; float: right">
    <span
      *ngIf="currentTab === 'Attributes'"
      class="fa fa-regular fa-edit mr-4 icons"
      (click)="editAttr()"
    ></span>
    <span
      class="fa fa-regular fa-trash mr-4 icons"
      (click)="deleteAttr()"
    ></span>
  </div>`,
  styles: ['.icons{color: #6C7584; cursor: pointer}'],
})
export class UserGridActionRendererComponent implements AgRendererComponent {
  params: any;
  currentTab: String = '';
  constructor() {}

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.currentTab = this.params.context.componentParent.currentTab;
  }

  editAttr() {
    this.params.context.componentParent.editAttribute(this.params.data);
  }

  deleteAttr() {
    let data = {};
    if (this.currentTab === 'Attributes') {
      const user = this.params.user;
      const arr = Object.entries(user.attributes);
      const x = arr.find((ele) => _.isEqual(ele[1], this.params.data));

      data[x[0]] = x[1];
    } else {
      data = this.params.data;
    }
    this.currentTab === 'Attributes'
      ? this.params.context.componentParent.deleteAttribute(data)
      : this.params.context.componentParent.deleteGroup(this.params.data);
  }
}