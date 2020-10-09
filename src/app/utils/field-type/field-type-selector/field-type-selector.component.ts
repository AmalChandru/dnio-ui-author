import { Component, Input, Output, EventEmitter, ViewChild, TemplateRef, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Form } from '@angular/forms';
import { SchemaBuilderService } from 'src/app/home/schema-utils/schema-builder.service';
import { sameName } from 'src/app/home/custom-validators/same-name-validator';
import { NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from '../../services/common.service';

@Component({
  selector: 'odp-field-type-selector',
  templateUrl: './field-type-selector.component.html',
  styleUrls: ['./field-type-selector.component.scss']
})
export class FieldTypeSelectorComponent {

  @ViewChild('typeChangeModalTemplate', { static: false }) typeChangeModalTemplate: TemplateRef<HTMLElement>;
  @Input() form: FormGroup;
  @Input() isLibrary: boolean;
  @Input() isDataFormat: boolean;
  @Input() formatType: string;
  @Input() edit: any;
  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean>;
  toggleDropdown: boolean;
  types: Array<any>;
  typeChangeModalTemplateRef: NgbModalRef;
  constructor(private schemaService: SchemaBuilderService,
    private commonService: CommonService,
    private fb: FormBuilder) {
    const self = this;
    self.toggleChange = new EventEmitter();
    self.types = self.schemaService.getSchemaTypes();
    self.types.shift();
    self.edit = {
      status: false
    };
  }

  getTooltipText(index: number) {
    const self = this;
    if (self.form.get('key').value === '_self' && index === 5) {
      return 'Collection of collection is not possible';
    } else if ((index === 8 || index === 9) && self.isLibrary) {
      return 'Relation or Schema is not possible';
    } else {
      return '';
    }
  }

  selectAllowed(index: number) {
    const self = this;
    if ((index === 5 && self.form.get('key').value === '_self') ||
      (index === 6 && self.isDataFormat) ||
      (index === 7 && self.isDataFormat) ||
      (index === 8 && (self.isLibrary || self.isDataFormat)) ||
      (index === 9 && (self.isLibrary || self.isDataFormat))) {
      return false;
    }
    if ((index === 4 && self.formatType !== 'JSON' && self.formatType !== 'XML' && self.isDataFormat) ||
      (index === 5 && self.formatType !== 'JSON' && self.formatType !== 'XML' && self.isDataFormat)) {
      return false;
    }

   
    return true;
  }

  switchType(type: any, event: Event) {
    const self = this;
    if (self.isEdit && self.editable && self.form.get('_newField') && !self.form.get('_newField').value) {
      self.typeChangeModalTemplateRef = self.commonService.modal(self.typeChangeModalTemplate);
      self.typeChangeModalTemplateRef.result.then((close) => {
        if (close) {
          self.form.get('properties._typeChanged').patchValue(self.form.get('type').value);
          self.changeType(type, event);
        }
      }, dismiss => { });
    } else if (self.editable) {
      self.changeType(type, event);
    }
  }

  changeType(type: any, event: Event) {
    const self = this;
    if (type.value === 'String' || type.value === 'Number' || type.value === 'Date' || type.value === 'Geojson') {
      event.stopPropagation();
    } else {
      self.close();
    }
    self.form.get('type').patchValue(type.value);
    self.form.get('type').markAsDirty();
    self.form.removeControl('definition');
    let key = null;
    if (type.value === 'Array') {
      key = '_self';
    }
    const tempProp = self.schemaService
      .getPropertiesStructure({
        key: self.form.get('properties.name').value || key,
        properties: {
          label: self.form.get('properties.label').value,
          errorMessage: self.form.get('properties.errorMessage').value,
          _isGrpParentArray: self.form.get('properties._isGrpParentArray').value
        },
       
        type: type.value
      });
    for (const i in (self.form.get('properties') as FormGroup).controls) {
      if (i === 'name') {
        continue;
      }
      (self.form.get('properties') as FormGroup).removeControl(i);
    }
    for (const i in tempProp.controls) {
      if (i === 'name') {
        continue;
      }
      (self.form.get('properties') as FormGroup).addControl(i, tempProp.controls[i]);
    }

    if (type.value === 'Object') {
      let temp;
      if (self.form.get('key').value === '_self') {
        temp = self.schemaService.getDefinitionStructure({ _newField: true, properties: { _isParrentArray: true ,_isGrpParentArray: true } },true);
        
      } 
      else if(self.form.get('properties._isGrpParentArray').value  ){
        temp = self.schemaService.getDefinitionStructure({ _newField: true,properties: { _isGrpParentArray: true } });
      }
      else {
        temp = self.schemaService.getDefinitionStructure({ _newField: true });
      }
      self.form.addControl('definition', self.fb.array([temp]));
    }
    if (type.value === 'Array') {
      const temp = self.schemaService.getDefinitionStructure({ key: '_self', _newField: true });
      self.form.addControl('definition', self.fb.array([temp]));
    }
    if (type.value === 'Array' || type.value === 'Object') {
      self.form.get('definition').setValidators([sameName]);
    }
    self.schemaService.typechanged.emit(true);
  }

  changeDetailedType(value: string) {
    const self = this;
    if (self.form.get('properties.email')) {
      self.form.get('properties.email').patchValue(false);
    }
    if (self.form.get('properties.password')) {
      self.form.get('properties.password').patchValue(false);
    }
    if (self.form.get('properties.richText')) {
      self.form.get('properties.richText').patchValue(false);
    }
    if (self.form.get('properties.longText')) {
      self.form.get('properties.longText').patchValue(false);
    }
    if (self.form.get('properties.natural')) {
      self.form.get('properties.natural').patchValue(false);
    }
    if (self.form.get('properties.pattern')) {
      self.form.get('properties.pattern').patchValue(null);
    }
    if (self.form.get('properties.enum')) {
      (self.form.get('properties') as FormGroup).removeControl('enum');
      (self.form.get('properties') as FormGroup).addControl('enum', self.fb.array([]));
    }
    if (self.form.get('properties.hasTokens')) {
      (self.form.get('properties') as FormGroup).removeControl('hasTokens');
      (self.form.get('properties') as FormGroup).addControl('hasTokens', self.fb.array([]));
    }
    if (value === 'email') {
      self.form.get('properties.email').patchValue(true);
    }
    if (value === 'password') {
      self.form.get('properties.password').patchValue(true);
      self.form.get('properties.unique').patchValue(false);
    }
    if (value === 'long') {
      self.form.get('properties.longText').patchValue(true);
    }
    if (value === 'rich') {
      self.form.get('properties.richText').patchValue(true);
    }
    if (value === 'natural') {
      self.form.get('properties.natural').patchValue(true);
    }
    if (value === 'date' || 'datetime-local' && self.form.get('properties.dateType')) {
      self.form.get('properties.dateType').patchValue(value);
    }
    if (value === 'point' && self.form.get('properties.geoType')) {
      self.form.get('properties.geoType').patchValue(value);
    }
    if (self.form.get('properties.maxlength') && self.form.get('properties.maxlength').value) {
      self.form.get('properties.maxlength').patchValue(null);
    }
    if (self.form.get('properties.minlength') && self.form.get('properties.minlength').value) {
      self.form.get('properties.minlength').patchValue(null);
    }
    self.form.get('properties._detailedType').patchValue(value);
    self.form.markAsDirty();
    self.close();
  }

  close() {
    const self = this;
    self.toggle = false;
    self.toggleChange.emit(false);
  }

  get isEdit() {
    const self = this;
    if (self.edit && self.edit.id) {
      return true;
    }
    return false;
  }

  get editable() {
    const self = this;
    if (self.edit && self.edit.status) {
      return true;
    }
    return false;
  }

  get type() {
    const self = this;
    if (self.form && self.form.get('type')) {
      return self.form.get('type').value;
    }
    return 'String';
  }

  get detailedType() {
    const self = this;
    if (self.form && self.form.get('properties._detailedType')) {
      return self.form.get('properties._detailedType').value;
    }
    return '';
  }

  get dateType() {
    const self = this;
    if (self.form && self.form.get('properties.dateType')) {
      return self.form.get('properties.dateType').value;
    }
    return 'date';
  }

  get geoType() {
    const self = this;
    if (self.form && self.form.get('properties.geoType')) {
      return self.form.get('properties.geoType').value;
    }
    return 'point';
  }
}
