import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { B2bFlowsManageComponent } from './b2b-flows-manage.component';
import { ViewBoxDirective } from './view-box.directive';
import { ClickOutsideModule } from 'src/app/utils/directives/click-outside/click-outside.module';
import { BreadcrumbModule } from 'src/app/utils/breadcrumb/breadcrumb.module';
import { SearchBoxModule } from 'src/app/utils/search-box/search-box.module';
import { DeleteModalModule } from 'src/app/utils/delete-modal/delete-modal.module';
import { FormatTypeBadgeModule } from 'src/app/utils/format-type-badge/format-type-badge.module';
import { BasicInfoModule } from 'src/app/utils/basic-info/basic-info.module';
import { CodeEditorModule } from 'src/app/utils/code-editor/code-editor.module';
import { DateFormatModule } from 'src/app/utils/date-format/date-format.module';
import { OnChangeModule } from 'src/app/utils/directives/on-change/on-change.module';
import { FlowNodeComponent } from './flow-node/flow-node.component';
import { AutoFocusModule } from 'src/app/utils/directives/auto-focus/auto-focus.module';
import { B2bFlowService } from './b2b-flow.service';

const routes: Routes = [
  {
    path: '', component: B2bFlowsManageComponent
  }
];

@NgModule({
  declarations: [
    B2bFlowsManageComponent,
    ViewBoxDirective,
    FlowNodeComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    FormsModule,
    NgbModule,
    ClickOutsideModule,
    BreadcrumbModule,
    SearchBoxModule,
    DeleteModalModule,
    FormatTypeBadgeModule,
    BasicInfoModule,
    BreadcrumbModule,
    CodeEditorModule,
    DateFormatModule,
    OnChangeModule,
    AutoFocusModule
  ],
  exports: [B2bFlowsManageComponent],
  providers:[B2bFlowService]
})
export class B2bFlowsManageModule { }
