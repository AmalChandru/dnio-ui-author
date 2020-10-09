import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadImageDirective } from './upload-image.directive';



@NgModule({
  declarations: [UploadImageDirective],
  imports: [
    CommonModule
  ],
  exports: [UploadImageDirective],
})
export class UploadImageModule { }
